import mongoose from "mongoose";
import fs from "fs";
import csv from "csv-parser";
import dotenv from "dotenv";
import { TaxCode } from "../models/taxCodeModel.js"; // Ensure this path is correct

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function importTaxCodes() {
  const taxCodes = [];

  // Stream CSV file and parse data with header cleanup
  fs.createReadStream(
    "/Users/fundamentalresearch/Desktop/interstellar-app-server/src/data/product_tax_codes.csv"
  )
    .pipe(csv())
    .on("data", (row) => {
      // Normalize header names by removing quotes and trimming whitespace
      const normalizedRow = {};
      for (const key in row) {
        const cleanKey = key.replace(/['"]+/g, "").trim();
        normalizedRow[cleanKey] = row[key].replace(/['"]+/g, "").trim();
      }

      // Map normalized data to your expected schema fields
      const cleanRow = {
        stripeTaxCode: normalizedRow.stripeTaxCode || "",
        type: normalizedRow.type || "",
        description: normalizedRow.description || "",
        name: normalizedRow.name || "",
      };

      // Check for required fields and log any missing data
      if (!cleanRow.stripeTaxCode) {
        console.warn("Skipping row due to missing stripeTaxCode:", cleanRow);
        return; // Skip this row if the stripeTaxCode is missing
      }

      if (!cleanRow.type || !cleanRow.description || !cleanRow.name) {
        console.warn("Missing other required field(s) in row:", cleanRow);
        return; // Skip this row if any other required field is missing
      }

      // Add the cleaned row to the taxCodes array
      taxCodes.push(cleanRow);
    })
    .on("end", async () => {
      try {
        if (taxCodes.length === 0) {
          console.error("No valid data found in CSV file. Import aborted.");
          mongoose.connection.close();
          return;
        }

        // Insert data into MongoDB and handle errors
        await TaxCode.insertMany(taxCodes);
        console.log("Tax codes have been successfully imported");
      } catch (error) {
        console.error("Error inserting tax codes:", error);
      } finally {
        mongoose.connection.close();
      }
    })
    .on("error", (error) => {
      console.error("Error reading CSV file:", error);
    });
}

// Run the import function
importTaxCodes();
