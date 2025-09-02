import aquariusBG from "./assets/aquariusBG.jpg";
import esplanadaBG from "./assets/esplanadaBG.jpeg";

export const getConstants = () => {
  const aquarius = {
    SAFE_DELETE_TEXT: "Aquarius",
    CONGREGATION: "Aquarius",
    BACKGROUND_IMAGE: aquariusBG,
    PLACES: ["TODO AQUARIUS"],
    DEVICES: ["Carrinho 2", "Display 2"],
    WHATSAPP: "553184371888",
    AUTH: false,
  };
  const esplanada = {
    SAFE_DELETE_TEXT: "Esplanada",
    CONGREGATION: "Jardim Esplanada",
    BACKGROUND_IMAGE: esplanadaBG,
    PLACES: [
      "Santos Dumont - Portaria 14 Bis",
      "Santos Dumont - Portaria Ademar de Barros",
      "Sesc",
      "Feira na Santa Clara (Sexta-Feira)",
      "Praça Romão Gomes",
      "Vicentina Aranha",
      "Hospital Santos Dumont",
    ],
    DEVICES: ["Carrinho 1", "Display 1"],
    WHATSAPP: "5512996456249",
    AUTH: true,
  };

  const deploy = process.env.NEXT_PUBLIC_DEPLOY;
  if (deploy === "aquarius") {
    return aquarius;
  } else if (deploy === "esplanada") {
    return esplanada;
  } else {
    return {
      SAFE_DELETE_TEXT: "DEPLOY_NOT_SET",
      CONGREGATION: "DEPLOY_NOT_SET",
      BACKGROUND_IMAGE: "#",
      PLACES: [],
      DEVICES: new Array<string>(),
      WHATSAPP: "",
      AUTH: false,
    };
  }
};
