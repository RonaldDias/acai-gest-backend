import pool from "../../config/database.js";

export async function updatePin(req, res) {
  try {
    const { pin } = req.body;
    const userId = req.user.userId;

    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ success: false, message: "PIN inválido." });
    }

    await pool.query("UPDATE usuarios SET pin = $1 WHERE id = $2", [
      pin,
      userId,
    ]);

    res.json({ success: true, message: "PIN atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar PIN:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor." });
  }
}
