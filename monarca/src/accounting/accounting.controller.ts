/**
 * FileName: accounting.controller.ts
 * Description: REST controller for accounting poliza generation and GL catalog management.
 *              Catalog and comp_code endpoints require CompanyAdminGuard.
 *              Poliza generation and completed-requests listing require check_budgets (SOI).
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/05/2026 [Julio Rodriguez] Created controller.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { UpdateAccountingCatalogDto, UpsertAccountingConceptDto, SetCompCodeDto } from './dto/accounting.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { Permissions } from 'src/guards/decorators/permission.decorator';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@UseGuards(AuthGuard, PermissionsGuard)
@ApiTags('Accounting')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ── Catalog management (company admin only) ─────────────────────────────────

  /**
   * getCatalog — Returns the GL account catalog for a company.
   * Input: companyId (UUID path param).
   * Output: AccountingCatalog entity (created empty if missing).
   */
  @UseGuards(CompanyAdminGuard)
  @Get('companies/:companyId/catalog')
  getCatalog(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.accountingService.getOrCreateCatalog(companyId);
  }

  /**
   * updateCatalog — Updates GL accounts in the company's accounting catalog.
   * Input: companyId (UUID), UpdateAccountingCatalogDto.
   * Output: updated AccountingCatalog entity.
   */
  @UseGuards(CompanyAdminGuard)
  @Patch('companies/:companyId/catalog')
  updateCatalog(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: UpdateAccountingCatalogDto,
    @Req() req: RequestInterface,
  ) {
    return this.accountingService.updateCatalog(companyId, dto, req.userInfo);
  }

  /**
   * setCompCode — Sets the SAP company code on the company record.
   * Input: companyId (UUID), SetCompCodeDto.
   * Output: updated Company entity.
   */
  @UseGuards(CompanyAdminGuard)
  @Patch('companies/:companyId/comp-code')
  setCompCode(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: SetCompCodeDto,
    @Req() req: RequestInterface,
  ) {
    return this.accountingService.setCompCode(companyId, dto, req.userInfo);
  }

  /**
   * listConcepts — Returns all concept-to-GL mappings for a company.
   * Input: companyId (UUID).
   * Output: AccountingConcept array.
   */
  @UseGuards(CompanyAdminGuard)
  @Get('companies/:companyId/concepts')
  listConcepts(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Req() req: RequestInterface,
  ) {
    return this.accountingService.listConcepts(companyId, req.userInfo);
  }

  /**
   * upsertConcept — Creates or updates the GL account for a voucher concept.
   * Input: companyId (UUID), UpsertAccountingConceptDto.
   * Output: AccountingConcept entity.
   */
  @UseGuards(CompanyAdminGuard)
  @Post('companies/:companyId/concepts')
  upsertConcept(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: UpsertAccountingConceptDto,
    @Req() req: RequestInterface,
  ) {
    return this.accountingService.upsertConcept(companyId, dto, req.userInfo);
  }

  /**
   * deleteConcept — Removes a concept-to-GL mapping.
   * Input: companyId (UUID), conceptId (UUID).
   * Output: deletion confirmation.
   */
  @UseGuards(CompanyAdminGuard)
  @Delete('companies/:companyId/concepts/:conceptId')
  deleteConcept(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Req() req: RequestInterface,
  ) {
    return this.accountingService.deleteConcept(companyId, conceptId, req.userInfo);
  }

  // ── Poliza generation (SOI — check_budgets) ─────────────────────────────────

  /**
   * getCompletedRequests — Returns completed requests available for poliza export.
   * Input: none (company scoped from caller's userInfo).
   * Output: Request array.
   */
  @Permissions('check_budgets')
  @Get('requests/completed')
  getCompletedRequests(@Req() req: RequestInterface) {
    return this.accountingService.getCompletedRequests(req.userInfo);
  }

  /**
   * generatePoliza — Generates the accounting poliza JSON for a request.
   * Input: requestId (UUID path param).
   * Output: PolizaOutput with polizas array.
   */
  @Permissions('check_budgets')
  @Get('requests/:requestId/poliza')
  generatePoliza(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Req() req: RequestInterface,
  ) {
    return this.accountingService.generatePoliza(requestId, req.userInfo);
  }
}
