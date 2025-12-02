import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/keymantra";
const sql = postgres(DATABASE_URL);

async function resetDatabase() {
  try {
    console.log("🔄 开始清理数据库...");

    // 删除所有表（包括迁移记录表）
    await sql`
      DROP TABLE IF EXISTS questions CASCADE;
    `;
    console.log("✅ 已删除 questions 表");

    await sql`
      DROP TABLE IF EXISTS __drizzle_migrations CASCADE;
    `;
    console.log("✅ 已删除迁移记录表");

    console.log("✨ 数据库清理完成！现在可以运行 npm run db:migrate 重新迁移");
  } catch (error) {
    console.error("❌ 错误:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

resetDatabase();

