import { describe, expect, it } from "vitest";
import {
  createClientSchema,
  isValidBrazilianPhone,
  isValidCnpj,
  isValidCpf,
  normalizeBrazilianPhone,
} from "../src/schemas/client.schema.js";

describe("Client document and phone validation (unit)", () => {
  describe("isValidCpf", () => {
    it("accepts valid CPFs with correct check digits", () => {
      expect(isValidCpf("52998224725")).toBe(true);
      expect(isValidCpf("11144477735")).toBe(true);
    });

    it("rejects repeated digits, wrong lengths, and invalid check digits", () => {
      expect(isValidCpf("00000000000")).toBe(false);
      expect(isValidCpf("11111111111")).toBe(false);
      expect(isValidCpf("52998224720")).toBe(false);
      expect(isValidCpf("52998224705")).toBe(false);
      expect(isValidCpf("5299822472")).toBe(false);
    });
  });

  describe("isValidCnpj", () => {
    it("accepts valid CNPJs with correct check digits", () => {
      expect(isValidCnpj("11222333000181")).toBe(true);
    });

    it("rejects repeated digits, wrong lengths, and invalid check digits", () => {
      expect(isValidCnpj("00000000000000")).toBe(false);
      expect(isValidCnpj("11111111111111")).toBe(false);
      expect(isValidCnpj("11222333000182")).toBe(false);
      expect(isValidCnpj("11222333000101")).toBe(false);
      expect(isValidCnpj("1122233300018")).toBe(false);
    });
  });

  describe("normalizeBrazilianPhone & isValidBrazilianPhone", () => {
    it("accepts valid mobile and landline numbers with valid Brazilian DDDs", () => {
      expect(isValidBrazilianPhone("51998765432")).toBe(true);
      expect(isValidBrazilianPhone("5137142000")).toBe(true);
      expect(isValidBrazilianPhone("11987654321")).toBe(true);
    });

    it("normalizes formatted numbers and +55 country prefix", () => {
      expect(normalizeBrazilianPhone("+55 (51) 99876-5432")).toBe("51998765432");
      expect(normalizeBrazilianPhone("5551999999999")).toBe("51999999999");
      expect(normalizeBrazilianPhone("(51) 3714-2000")).toBe("5137142000");
    });

    it("rejects invalid DDDs, missing DDDs, repeated digits, and invalid prefixes", () => {
      expect(isValidBrazilianPhone("99876543")).toBe(false); // 8 digits without DDD
      expect(isValidBrazilianPhone("00998765432")).toBe(false); // invalid DDD 00
      expect(isValidBrazilianPhone("52998765432")).toBe(false); // nonexistent DDD 52
      expect(isValidBrazilianPhone("11111111111")).toBe(false); // all same digit
      expect(isValidBrazilianPhone("99999999999")).toBe(false); // all same digit
      expect(isValidBrazilianPhone("51123456789")).toBe(false); // 11 digits not starting with 9
      expect(isValidBrazilianPhone("51908765432")).toBe(false); // mobile starting with 90
      expect(isValidBrazilianPhone("5199999999")).toBe(false); // 10-digit landline starting with 9
      expect(isValidBrazilianPhone("5107142000")).toBe(false); // landline starting with 0
      expect(normalizeBrazilianPhone("51abc99999")).toBeNull();
    });
  });

  describe("createClientSchema", () => {
    it("normalizes formatted CPF and phone for INDIVIDUAL clients", () => {
      const parsed = createClientSchema.parse({
        type: "INDIVIDUAL",
        name: "Maria Oliveira",
        document: "529.982.247-25",
        phone: "(51) 3714-2000",
        whatsapp: "+55 (51) 99876-5432",
        location: "Lajeado",
      });

      expect(parsed.document).toBe("52998224725");
      expect(parsed.phone).toBe("5137142000");
      expect(parsed.whatsapp).toBe("51998765432");
    });

    it("rejects mismatched document type (CNPJ for INDIVIDUAL or CPF for COMPANY)", () => {
      const individualWithCnpj = createClientSchema.safeParse({
        type: "INDIVIDUAL",
        name: "Pessoa Física",
        document: "11222333000181",
        whatsapp: "51998765432",
        location: "Lajeado",
      });
      expect(individualWithCnpj.success).toBe(false);

      const companyWithCpf = createClientSchema.safeParse({
        type: "COMPANY",
        name: "Empresa LTDA",
        document: "52998224725",
        whatsapp: "51998765432",
        location: "Lajeado",
      });
      expect(companyWithCpf.success).toBe(false);
    });
  });
});
