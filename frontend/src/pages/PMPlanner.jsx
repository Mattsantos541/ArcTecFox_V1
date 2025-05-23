import { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// --- Placeholder UI Components ---
// You can replace these with your own UI components (e.g., from Tailwind UI or your design system)
function Input({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col mb-2">
      {label && <label className="font-medium mb-1">{label}</label>}
      <input
        className="border border-gray-300 rounded px-2 py-1"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

function Button({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white shadow-md rounded p-4 mb-4">
      {title && <h2 className="text-lg font-bold mb-2">{title}</h2>}
      {children}
    </div>
  );
}

// --- End Placeholder UI Components ---

// Use proxy-friendly base URL (ensure vite.config.js proxies /api to your FastAPI backend)
const API_BASE_URL = "/api";

export default function PMPlanner() {
  const [assetData, setAssetData] = useState({
    name: "",
    model: "",
    serial: "",
    category: "",
    hours: "",
    cycles: "",
    environment: "",
  });

  const [pmPlan, setPmPlan] = useState([]);   // Array of maintenance tasks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssetData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Call backend API to generate PM plan
  const generatePMPlan = async () => {
    setLoading(true);
    setPmPlan([]);
    setError(null);

    try {
      // Convert hours and cycles to numbers
      const payload = {
        ...assetData,
        hours: assetData.hours ? parseInt(assetData.hours) : 0,
        cycles: assetData.cycles ? parseInt(assetData.cycles) : 0,
      };

      console.log("📤 Payload:", payload);

      const response = await axios.post(`${API_BASE_URL}/generate_pm_plan`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
        timeout: 30000,
      });

      if (response.data?.data?.maintenance_plan) {
        setPmPlan(response.data.data.maintenance_plan);
        console.log("✅ Received PM Plan:", response.data.data.maintenance_plan);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (err) {
      console.error("❌ Error generating PM plan:", err);
      setError("Failed to generate PM plan. Check your input and backend logs.");
    }

    setLoading(false);
  };

  // Export the PM plan as CSV
  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(pmPlan);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "PMPlan.csv");
  };

  // Export the PM plan as XLSX
  const exportToXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(pmPlan);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PMPlan");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "PMPlan.xlsx");
  };

  return (
    <div className="flex flex-col w-full p-4">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-4">Preventive Maintenance Planner</h1>

      {/* Card: Asset Data Input */}
      <Card title="Asset Data Input">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Asset Name"
            name="name"
            value={assetData.name}
            onChange={handleInputChange}
            placeholder="e.g. Hydraulic Pump"
          />
          <Input
            label="Model"
            name="model"
            value={assetData.model}
            onChange={handleInputChange}
            placeholder="e.g. XJ-2000"
          />
          <Input
            label="Serial Number"
            name="serial"
            value={assetData.serial}
            onChange={handleInputChange}
            placeholder="e.g. SN12345"
          />
          <Input
            label="Asset Category"
            name="category"
            value={assetData.category}
            onChange={handleInputChange}
            placeholder="e.g. Pump"
          />
          <Input
            label="Usage Hours"
            name="hours"
            value={assetData.hours}
            onChange={handleInputChange}
            placeholder="e.g. 1200"
            type="number"
          />
          <Input
            label="Usage Cycles"
            name="cycles"
            value={assetData.cycles}
            onChange={handleInputChange}
            placeholder="e.g. 300"
            type="number"
          />
          <Input
            label="Environmental Condition"
            name="environment"
            value={assetData.environment}
            onChange={handleInputChange}
            placeholder="e.g. Outdoor, dusty"
          />
        </div>
        <div className="mt-4">
          <Button onClick={generatePMPlan} disabled={loading}>
            {loading ? "Generating..." : "Generate AI-Powered PM Plan"}
          </Button>
        </div>
      </Card>

      {/* Card: AI-Powered PM Plan Preview */}
      <Card title="AI-Powered PM Plan">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <span className="text-gray-700">Generating PM Plan...</span>
          </div>
        ) : pmPlan.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b">Task Name</th>
                  <th className="px-4 py-2 border-b">Interval</th>
                  <th className="px-4 py-2 border-b">Instructions</th>
                  <th className="px-4 py-2 border-b">Reason</th>
                  <th className="px-4 py-2 border-b">Safety Precautions</th>
                </tr>
              </thead>
              <tbody>
                {pmPlan.map((task, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{task.task_name}</td>
                    <td className="px-4 py-2">{task.maintenance_interval}</td>
                    <td className="px-4 py-2">
                      {Array.isArray(task.instructions) ? (
                        <ul className="list-disc list-inside">
                          {task.instructions.map((instr, idx) => (
                            <li key={idx}>{instr}</li>
                          ))}
                        </ul>
                      ) : (
                        task.instructions
                      )}
                    </td>
                    <td className="px-4 py-2">{task.reason}</td>
                    <td className="px-4 py-2">{task.safety_precautions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No PM Plan Generated Yet</p>
        )}
      </Card>

      {/* Card: Export & Integration */}
      <Card title="Export & Integration">
        <div className="flex space-x-4">
          <Button onClick={exportToCSV} disabled={pmPlan.length === 0}>
            Download as CSV
          </Button>
          <Button onClick={exportToXLSX} disabled={pmPlan.length === 0}>
            Download as Excel
          </Button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
