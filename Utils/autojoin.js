import { joinBinary } from "../Controllers/binaryController.js";
import { joinMatrix } from "../Controllers/MatrixContreoller.js";
import { joinUnilevel } from "../Controllers/UnilevelController.js";

export const joinBinaryAuto = async (user) => {
  try {
    if (!user.parent) {
      const result = await joinBinary(user);

      console.log("Binary joined:", result?.message || "success");
    }
  } catch (err) {
    console.log("Binary Auto Join Error:", err.message);
  }
};

export const joinMatrixAuto = async (user) => {
  try {
    if (!user.parentMatrix) {
      const result = await joinMatrix(user);

      console.log("Matrix joined:", result?.message || "success");
    }
  } catch (err) {
    console.log("Matrix Auto Join Error:", err.message);
  }
};

export const joinUnilevelAuto = async (user) => {
  try {
    if (!user.parentUnilevel) {
      const result = await joinUnilevel(user);

      console.log("Unilevel joined:", result?.message || "success");
    }
  } catch (err) {
    console.log("Unilevel Auto Join Error:", err.message);
  }
};