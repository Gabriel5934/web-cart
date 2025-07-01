import aquariusBG from "./assets/aquariusBG.jpg";
import esplanadaBG from "./assets/esplanadaBG.jpeg";

export const getConstants = () => {
  const aquarius = {
    SAFE_DELETE_TEXT: "Aquarius",
    CONGREGATION: "Aquarius",
    BACKGROUND_IMAGE: aquariusBG,
    PLACES: ["TODO AQUARIUS"],
    DEVICES: ["Carrinho 2", "Display 2"],
  };
  const esplanada = {
    SAFE_DELETE_TEXT: "Esplanada",
    CONGREGATION: "Jardim Esplanada",
    BACKGROUND_IMAGE: esplanadaBG,
    PLACES: [
      "Portaria 14 Bis",
      "Sesc",
      "Feira Santa Clara",
      "Praça Romão Gomes",
      "Parque Ribeirão Vermelho",
      "Feira do Urbanova",
      "Vicentina Aranha",
    ],
    DEVICES: ["Carrinho 1", "Display 1"],
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
      DEVICES: [],
    };
  }
};
