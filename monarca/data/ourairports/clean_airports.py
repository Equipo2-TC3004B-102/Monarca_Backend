import pandas as pd
from pathlib import Path

INPUT_FILE = Path("airports.csv")
OUTPUT_FILE = Path("airports_clean.csv")

def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"No se encontró el archivo {INPUT_FILE}. "
            "Coloca airports.csv en la misma carpeta que este script."
        )

    df = pd.read_csv(INPUT_FILE)
    print("Shape original:", df.shape)

    columns_needed = [
        "name",
        "iata_code",
        "iso_country",
        "municipality",
        "type",
        "latitude_deg",
        "longitude_deg",
    ]

    missing_columns = [col for col in columns_needed if col not in df.columns]
    if missing_columns:
        raise ValueError(
            "Faltan columnas esperadas en airports.csv: "
            + ", ".join(missing_columns)
        )

    df = df[columns_needed].copy()
    print("Después de seleccionar columnas:", df.shape)

    df = df[df["iata_code"].notna()].copy()
    print("Después de quitar filas sin IATA:", df.shape)

    df = df[df["type"].isin(["medium_airport", "large_airport"])].copy()
    print("Después de filtrar medium/large airports:", df.shape)

    text_columns = ["name", "iata_code", "iso_country", "municipality", "type"]
    for col in text_columns:
        df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

    df = df.drop_duplicates(subset=["iata_code"]).copy()
    print("Después de quitar duplicados por IATA:", df.shape)

    df = df[
        df["name"].notna()
        & df["iata_code"].notna()
        & df["iso_country"].notna()
    ].copy()

    df = df.rename(
        columns={
            "name": "airport_name",
            "iso_country": "country_code",
            "municipality": "city",
            "type": "airport_type",
            "latitude_deg": "latitude",
            "longitude_deg": "longitude",
        }
    )

    df.to_csv(OUTPUT_FILE, index=False)

    print("\nValidaciones:")
    print("IATA nulos:", df["iata_code"].isna().sum())
    print("Duplicados IATA:", df["iata_code"].duplicated().sum())
    print("Tipos de aeropuerto:", df["airport_type"].unique())
    print("\nArchivo limpio generado:", OUTPUT_FILE)
    print("Shape final:", df.shape)
    print(df.head())

if __name__ == "__main__":
    main()
