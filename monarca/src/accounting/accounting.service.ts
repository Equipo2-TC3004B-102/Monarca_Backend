/**
 * FileName: accounting.service.ts
 * Description: Service for accounting poliza generation and catalog management.
 *              Handles three poliza cases per Ditta specification:
 *              - AV  (Anticipo de Viaje): generated when a request has an advance.
 *              - GV  (Comprobación): generated alongside AV when advance > 0.
 *              - GV  (Sin Anticipo): generated when advance == 0.
 *              Also manages per-company GL account catalogs and concept mappings.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/05/2026 [Julio Rodriguez] Created service.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingCatalog } from './entities/accounting-catalog.entity';
import { AccountingConcept } from './entities/accounting-concept.entity';
import { Company } from 'src/companies/entity/company.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { User } from 'src/users/entities/user.entity';
import { UpdateAccountingCatalogDto, UpsertAccountingConceptDto, SetCompCodeDto } from './dto/accounting.dto';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';
import { Poliza, PolizaLine, PolizaOutput } from './types/poliza.types';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(AccountingCatalog)
    private readonly catalogRepo: Repository<AccountingCatalog>,

    @InjectRepository(AccountingConcept)
    private readonly conceptRepo: Repository<AccountingConcept>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(Request)
    private readonly requestRepo: Repository<Request>,

    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private clientError(message: string, code: string) {
    return new BadRequestException({ message, code });
  }

  /**
   * formatPolizaDate — Formats a Date as DD/MM/YYYY for use in PSTNG_DATE.
   */
  private formatPolizaDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  /**
   * buildFolio — Formats request_num as YYYY-NNN using the request creation year.
   */
  private buildFolio(requestNum: number, createdAt: Date): string {
    const year = createdAt.getFullYear();
    return `${year}-${requestNum.toString().padStart(3, '0')}`;
  }

  // ── Catalog management ──────────────────────────────────────────────────────

  /**
   * getOrCreateCatalog — Returns the accounting catalog for a company, creating an
   *                      empty one if it does not yet exist.
   * Input: companyId (string).
   * Output: AccountingCatalog entity.
   */
  async getOrCreateCatalog(companyId: string): Promise<AccountingCatalog> {
    const existing = await this.catalogRepo.findOne({ where: { id_company: companyId } });
    if (existing) return existing;
    const created = this.catalogRepo.create({ id_company: companyId });
    return this.catalogRepo.save(created);
  }

  /**
   * updateCatalog — Updates the GL accounts in a company's accounting catalog.
   * Input: companyId (string), dto (UpdateAccountingCatalogDto), caller (UserInfoInterface).
   * Output: updated AccountingCatalog entity.
   */
  async updateCatalog(
    companyId: string,
    dto: UpdateAccountingCatalogDto,
    caller: UserInfoInterface,
  ): Promise<AccountingCatalog> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError('Access restricted to your own company', 'ACCOUNTING_FORBIDDEN');
    }
    const catalog = await this.getOrCreateCatalog(companyId);
    Object.assign(catalog, dto);
    return this.catalogRepo.save(catalog);
  }

  /**
   * listConcepts — Returns all concept-to-GL mappings for a company.
   * Input: companyId (string), caller (UserInfoInterface).
   * Output: AccountingConcept array.
   */
  async listConcepts(companyId: string, caller: UserInfoInterface): Promise<AccountingConcept[]> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError('Access restricted to your own company', 'ACCOUNTING_FORBIDDEN');
    }
    return this.conceptRepo.find({ where: { id_company: companyId } });
  }

  /**
   * upsertConcept — Creates or updates the GL account for a voucher concept.
   * Input: companyId (string), dto (UpsertAccountingConceptDto), caller (UserInfoInterface).
   * Output: AccountingConcept entity.
   */
  async upsertConcept(
    companyId: string,
    dto: UpsertAccountingConceptDto,
    caller: UserInfoInterface,
  ): Promise<AccountingConcept> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError('Access restricted to your own company', 'ACCOUNTING_FORBIDDEN');
    }
    const existing = await this.conceptRepo.findOne({
      where: { id_company: companyId, concept: dto.concept },
    });
    if (existing) {
      existing.gl_account = dto.gl_account;
      return this.conceptRepo.save(existing);
    }
    const created = this.conceptRepo.create({ id_company: companyId, ...dto });
    return this.conceptRepo.save(created);
  }

  /**
   * deleteConcept — Removes a concept-to-GL mapping by id.
   * Input: companyId (string), conceptId (string), caller (UserInfoInterface).
   * Output: deletion confirmation.
   */
  async deleteConcept(
    companyId: string,
    conceptId: string,
    caller: UserInfoInterface,
  ): Promise<{ status: boolean; message: string }> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError('Access restricted to your own company', 'ACCOUNTING_FORBIDDEN');
    }
    const concept = await this.conceptRepo.findOne({ where: { id: conceptId, id_company: companyId } });
    if (!concept) throw this.clientError(`Concept ${conceptId} not found`, 'CONCEPT_NOT_FOUND');
    await this.conceptRepo.delete(conceptId);
    return { status: true, message: `Concept ${conceptId} deleted` };
  }

  /**
   * setCompCode — Updates the SAP company code on the company record.
   * Input: companyId (string), dto (SetCompCodeDto), caller (UserInfoInterface).
   * Output: updated Company entity.
   */
  async setCompCode(
    companyId: string,
    dto: SetCompCodeDto,
    caller: UserInfoInterface,
  ): Promise<Company> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError('Access restricted to your own company', 'ACCOUNTING_FORBIDDEN');
    }
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw this.clientError(`Company ${companyId} not found`, 'COMPANY_NOT_FOUND');
    company.comp_code = dto.comp_code;
    return this.companyRepo.save(company);
  }

  // ── Poliza generation ───────────────────────────────────────────────────────

  /**
   * getCompletedRequests — Returns requests with status Completed for the caller's company.
   *                        Used by the SOI to select which trips to export.
   * Input: caller (UserInfoInterface).
   * Output: Request array with user relation loaded.
   */
  async getCompletedRequests(caller: UserInfoInterface): Promise<Request[]> {
    const where: Record<string, unknown> = { status: 'Completed' };
    if (!caller.is_system_admin && caller.id_company) {
      where.id_company = caller.id_company;
    }
    return this.requestRepo.find({ where, relations: ['user'], order: { createdAt: 'DESC' } });
  }

  /**
   * generatePoliza — Builds the full poliza JSON for a completed request.
   *                  Determines the case from advance_money:
   *                  > 0 → returns [AV poliza, GV comprobación poliza]
   *                  = 0 → returns [GV sin anticipo poliza]
   *                  Throws if the accounting catalog is not configured.
   * Input: requestId (string), caller (UserInfoInterface).
   * Output: PolizaOutput with polizas array.
   */
  async generatePoliza(requestId: string, caller: UserInfoInterface): Promise<PolizaOutput> {
    const request = await this.requestRepo.findOne({
      where: { id: requestId },
      relations: ['user', 'company'],
    });
    if (!request) throw this.clientError(`Request ${requestId} not found`, 'REQUEST_NOT_FOUND');

    if (!caller.is_system_admin && caller.id_company !== request.id_company) {
      throw this.clientError('Access restricted to requests in your company', 'ACCOUNTING_FORBIDDEN');
    }

    const vouchers = await this.voucherRepo.find({ where: { id_request: requestId } });

    const catalog = await this.getOrCreateCatalog(request.id_company);

    const concepts = await this.conceptRepo.find({ where: { id_company: request.id_company } });
    const conceptMap = new Map(concepts.map((c) => [c.concept, c.gl_account]));

    const folio = this.buildFolio(request.request_num, request.createdAt);
    const today = this.formatPolizaDate(new Date());
    const compCode = request.company?.comp_code ?? '';
    const currency = request.currency ?? 'MXN';
    const exchangeRate = Number(request.exchange_rate ?? 1);
    const user = request.user;
    const vendorNo = user?.provider ?? '';
    const employeeNum = user?.employee_num ?? '';
    const costCenter = user?.id_ceco ?? '';
    const advanceMoney = Number(request.advance_money ?? 0);

    const polizas: Poliza[] = [];

    if (advanceMoney > 0) {
      polizas.push(this.buildAVPoliza(folio, compCode, today, currency, exchangeRate, vendorNo, employeeNum, advanceMoney, catalog));
      polizas.push(this.buildGVPoliza(folio, compCode, today, currency, exchangeRate, vendorNo, employeeNum, costCenter, vouchers, catalog, conceptMap, true));
    } else {
      polizas.push(this.buildGVPoliza(folio, compCode, today, currency, exchangeRate, vendorNo, employeeNum, costCenter, vouchers, catalog, conceptMap, false));
    }

    return { polizas };
  }

  /**
   * buildAVPoliza — Builds the Anticipo de Viaje (AV) poliza.
   *                 Two lines: Debe Anticipo EMPLEADO / Haber Cta x Pagar Empleado.
   */
  private buildAVPoliza(
    folio: string,
    compCode: string,
    today: string,
    currency: string,
    exchangeRate: number,
    vendorNo: string,
    employeeNum: string,
    advanceMoney: number,
    catalog: AccountingCatalog,
  ): Poliza {
    const itemText = `Anticipo Viaje # ${folio} #Emp${employeeNum}`;
    return {
      header: {
        ID_VIAJE: folio,
        DOC_TYPE: 'AV',
        HEADER_TXT: `Anticipo Viaje # ${folio}`,
        COMP_CODE: compCode,
        PSTNG_DATE: today,
        CURRENCY: currency,
        EXCH_RATE: exchangeRate,
      },
      detail: [
        {
          ITEMNO_ACC: 1,
          SHKZG: 'S',
          GL_ACCOUNT: catalog.gl_advance,
          VENDOR_NO: vendorNo,
          ITEM_TEXT: itemText,
          AMT_DOCCUR: advanceMoney,
        },
        {
          ITEMNO_ACC: 2,
          SHKZG: 'H',
          GL_ACCOUNT: catalog.gl_cxp,
          VENDOR_NO: vendorNo,
          ITEM_TEXT: itemText,
          AMT_DOCCUR: advanceMoney,
        },
      ],
    };
  }

  /**
   * buildGVPoliza — Builds a Gasto de Viaje (GV) poliza for expense reconciliation.
   *                 withAdvance=true → Haber offsets the advance account (gl_advance).
   *                 withAdvance=false → Haber goes to employee CxP account (gl_cxp).
   *                 Each voucher generates one Debe for the expense and one Debe for IVA
   *                 when iva_trasladado is available.
   */
  private buildGVPoliza(
    folio: string,
    compCode: string,
    today: string,
    currency: string,
    exchangeRate: number,
    vendorNo: string,
    employeeNum: string,
    costCenter: string,
    vouchers: Voucher[],
    catalog: AccountingCatalog,
    conceptMap: Map<string, string>,
    withAdvance: boolean,
  ): Poliza {
    const headerTxt = withAdvance
      ? `Comprobación Viaje # ${folio}`
      : `Gasto sin Anticipo Viaje # ${folio}`;

    const detail: PolizaLine[] = [];
    let itemNo = 1;
    let totalAmount = 0;

    for (const voucher of vouchers) {
      const glAccount = conceptMap.get(voucher.class) ?? '';
      const hasIva = voucher.iva_trasladado != null && Number(voucher.iva_trasladado) > 0;
      const subtotal = voucher.subtotal != null
        ? Number(voucher.subtotal)
        : hasIva
          ? Number(voucher.amount) - Number(voucher.iva_trasladado)
          : Number(voucher.amount);
      const iva = hasIva ? Number(voucher.iva_trasladado) : 0;

      detail.push({
        ITEMNO_ACC: itemNo++,
        SHKZG: 'S',
        GL_ACCOUNT: glAccount,
        COSTCENTER: costCenter || undefined,
        ITEM_TEXT: voucher.class,
        AMT_DOCCUR: subtotal,
      });

      if (hasIva) {
        detail.push({
          ITEMNO_ACC: itemNo++,
          SHKZG: 'S',
          GL_ACCOUNT: catalog.gl_iva,
          ITEM_TEXT: voucher.class,
          AMT_DOCCUR: iva,
        });
      }

      totalAmount += subtotal + iva;
    }

    detail.push({
      ITEMNO_ACC: itemNo,
      SHKZG: 'H',
      GL_ACCOUNT: withAdvance ? catalog.gl_advance : catalog.gl_cxp,
      VENDOR_NO: vendorNo,
      ITEM_TEXT: `${withAdvance ? 'Comprobación' : 'Reembolso'} Viaje # ${folio} #Emp${employeeNum}`,
      AMT_DOCCUR: totalAmount,
    });

    return {
      header: {
        ID_VIAJE: folio,
        DOC_TYPE: 'GV',
        HEADER_TXT: headerTxt,
        COMP_CODE: compCode,
        PSTNG_DATE: today,
        CURRENCY: currency,
        EXCH_RATE: exchangeRate,
      },
      detail,
    };
  }
}
