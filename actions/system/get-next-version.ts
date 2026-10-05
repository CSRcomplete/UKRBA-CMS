import fs from "fs";
import path from "path";

export default async function getNextVersion() {
  try {
    // Resolve absolute path to package.json
    const filePath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(filePath)) {
      return "16.2.9";
    }
    const data = fs.readFileSync(filePath, "utf8");

    try {
      const packageJson = JSON.parse(data);
      const version = packageJson.dependencies["next"] || "16.2.9";
      return version;
    } catch (error) {
      console.error("Error parsing package.json:", error);
      return "16.2.9";
    }
  } catch (error) {
    console.error("Error reading package.json:", error);
    return "16.2.9";
  }
}
