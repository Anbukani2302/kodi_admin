// components/RelationOverridesManager.tsx
import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Layers, Upload } from "lucide-react";

interface Override {
  id: number;
  level: string;
  relation_code: string;
  language: string;
  lifestyle: string;
  familyname8?: string;
  family?: string;
  label: string;
}

interface CreateOverrideData {
  level: string;
  relation_code: string;
  language: string;
  lifestyle: string;
  familyname8?: string;
  family?: string;
  label: string;
}

const RelationOverridesManager: React.FC = () => {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [searchParams, setSearchParams] = useState({
    level: "all",
    language: "",
    lifestyle: "",
    familyname8: "",
    relation_code: "",
  });

  const [formData, setFormData] = useState<CreateOverrideData>({
    level: "language_lifestyle",
    relation_code: "",
    language: "",
    lifestyle: "",
    familyname8: "",
    family: "",
    label: "",
  });

  const [bulkData, setBulkData] = useState<CreateOverrideData[]>([
    {
      level: "familyname8",
      relation_code: "",
      language: "",
      lifestyle: "",
      familyname8: "",
      label: "",
    },
  ]);

  useEffect(() => {
    fetchOverrides();
  }, [searchParams]);

  const fetchOverrides = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/relation-overrides/search/?${params}`
      );
      const data = await response.json();
      setOverrides(data);
    } catch (error) {
      console.error("Error fetching overrides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulkFormChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...bulkData];
    updated[index] = { ...updated[index], [field]: value };
    setBulkData(updated);
  };

  const addBulkRow = () => {
    setBulkData((prev) => [
      ...prev,
      {
        level: "familyname8",
        relation_code: "",
        language: "",
        lifestyle: "",
        familyname8: "",
        label: "",
      },
    ]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkData.length > 1) {
      setBulkData((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCreateOverride = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/admin/relation-overrides/create_override/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await fetchOverrides();
        resetForm();
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error creating override:", error);
    }
  };

  const handleBulkCreate = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/relation-overrides/bulk_create/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            level: bulkData[0].level,
            overrides: bulkData,
          }),
        }
      );

      if (response.ok) {
        await fetchOverrides();
        setBulkData([
          {
            level: "familyname8",
            relation_code: "",
            language: "",
            lifestyle: "",
            familyname8: "",
            label: "",
          },
        ]);
        setShowBulkForm(false);
      }
    } catch (error) {
      console.error("Error bulk creating:", error);
    }
  };

  const handleDeleteOverride = async (level: string, id: number) => {
    if (window.confirm("Are you sure you want to delete this override?")) {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/relation-overrides/delete_override/?level=${level}&id=${id}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          await fetchOverrides();
        }
      } catch (error) {
        console.error("Error deleting override:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      level: "language_lifestyle",
      relation_code: "",
      language: "",
      lifestyle: "",
      familyname8: "",
      family: "",
      label: "",
    });
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      language_lifestyle: "bg-red-100 text-red-800",
      familyname8: "bg-green-100 text-green-800",
      family: "bg-purple-100 text-purple-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Relation Overrides
          </h2>
          <p className="text-gray-600 mt-1">
            Manage custom relation labels for specific contexts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Upload className="w-4 h-4" />
            Bulk Create
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <Plus className="w-4 h-4" />
            Create Override
          </button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="level"
            value={searchParams.level}
            onChange={handleSearchChange}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Levels</option>
            <option value="language_lifestyle">Language + lifestyle</option>
            <option value="familyname8">familyname8</option>
            <option value="family">Family</option>
          </select>

          <select
            name="language"
            value={searchParams.language}
            onChange={handleSearchChange}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Languages</option>
            <option value="ta">தமிழ் (ta)</option>
            <option value="en">English (en)</option>
          </select>

          <input
            type="text"
            name="lifestyle"
            value={searchParams.lifestyle}
            onChange={handleSearchChange}
            placeholder="lifestyle"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />

          <input
            type="text"
            name="relation_code"
            value={searchParams.relation_code}
            onChange={handleSearchChange}
            placeholder="Relation Code"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-4">
            Create New Override
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="language_lifestyle">Language + lifestyle</option>
                <option value="familyname8">familyname8</option>
                <option value="family">Family</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation Code
              </label>
              <input
                type="text"
                name="relation_code"
                value={formData.relation_code}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., FATHER"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Language</option>
                <option value="ta">தமிழ் (ta)</option>
                <option value="en">English (en)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                lifestyle
              </label>
              <input
                type="text"
                name="lifestyle"
                value={formData.lifestyle}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., hindu"
              />
            </div>

            {formData.level === "familyname8" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  familyname8
                </label>
                <input
                  type="text"
                  name="familyname8"
                  value={formData.familyname8}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., brahmin"
                />
              </div>
            )}

            {formData.level === "family" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family
                </label>
                <input
                  type="text"
                  name="family"
                  value={formData.family}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., iyengar"
                />
              </div>
            )}

            <div
              className={
                formData.level === "language_lifestyle" ? "md:col-span-2" : ""
              }
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                name="label"
                value={formData.label}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., தந்தை (ஹிந்து)"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOverride}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Bulk Create Form */}
      {showBulkForm && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Bulk Create Overrides</h3>
            <div className="flex gap-2">
              <button
                onClick={addBulkRow}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Add Row
              </button>
              <button
                onClick={() => setShowBulkForm(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Level
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Relation Code
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Language
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    lifestyle
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    familyname8
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Label
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bulkData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <select
                        value={row.level}
                        onChange={(e) =>
                          handleBulkFormChange(index, "level", e.target.value)
                        }
                        className="w-full text-sm border border-gray-300 rounded"
                      >
                        <option value="language_lifestyle">
                          Language+lifestyle
                        </option>
                        <option value="familyname8">familyname8</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.relation_code}
                        onChange={(e) =>
                          handleBulkFormChange(
                            index,
                            "relation_code",
                            e.target.value
                          )
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.language}
                        onChange={(e) =>
                          handleBulkFormChange(
                            index,
                            "language",
                            e.target.value
                          )
                        }
                        className="w-full text-sm border border-gray-300 rounded"
                      >
                        <option value="">Select Language</option>
                        <option value="ta">தமிழ் (ta)</option>
                        <option value="en">English (en)</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.lifestyle}
                        onChange={(e) =>
                          handleBulkFormChange(
                            index,
                            "lifestyle",
                            e.target.value
                          )
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.familyname8}
                        onChange={(e) =>
                          handleBulkFormChange(
                            index,
                            "familyname8",
                            e.target.value
                          )
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) =>
                          handleBulkFormChange(index, "label", e.target.value)
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeBulkRow(index)}
                        disabled={bulkData.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowBulkForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkCreate}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Create All
            </button>
          </div>
        </div>
      )}

      {/* Overrides Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading overrides...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  lifestyle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  familyname8
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Family
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overrides.map((override) => (
                <tr key={override.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getLevelColor(
                        override.level
                      )}`}
                    >
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {override.level.replace("_", " ")}
                      </div>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {override.relation_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        override.language === "ta"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {override.language === "ta" ? "தமிழ்" : "English"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {override.lifestyle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {override.familyname8 || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {override.family || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {override.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        handleDeleteOverride(override.level, override.id)
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && overrides.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No overrides found
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationOverridesManager;
