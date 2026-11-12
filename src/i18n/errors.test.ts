import { describe, expect, it } from "vitest";
import { translateMessage } from "./errors";

describe("translateMessage", () => {
  it("translates known messages to Portuguese", () => {
    expect(translateMessage("Email or password is incorrect.", "pt-BR")).toBe("E-mail ou senha incorretos.");
    expect(translateMessage("Passwords need at least 8 characters.", "pt-BR")).toBe("A senha precisa ter pelo menos 8 caracteres.");
    expect(translateMessage("@zed is taken. Try another username.", "pt-BR")).toBe("@zed já está em uso. Tente outro nome de usuário.");
  });
  it("leaves English and unknown messages alone", () => {
    expect(translateMessage("Email or password is incorrect.", "en")).toBe("Email or password is incorrect.");
    expect(translateMessage("Some new error", "pt-BR")).toBe("Some new error");
  });
});
