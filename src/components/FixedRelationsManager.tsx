// components/FixedRelationsManager.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';

interface FixedRelation {
  id?: number;
  relation_code: string;
  category: string;
  default_english: string;
  default_tamil: string;
}

const FixedRelationsManager: React.FC = () => {
  const [relations, setRelations] = useState<FixedRelation[]>([]);
  const [filteredRelations, setFilteredRelations] = useState<FixedRelation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<FixedRelation>({
    relation_code: '',
    category: '',
    default_english: '',
    default_tamil: ''
  });

  useEffect(() => {
    fetchRelations();
  }, []);

  useEffect(() => {
    const filtered = relations.filter(rel =>
      rel.relation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.default_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.default_tamil.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRelations(filtered);
  }, [searchTerm, relations]);

  const fetchRelations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/relationsfixed-relations/`);
      const data = await response.json();
      setRelations(data);
      setFilteredRelations(data);
    } catch (error) {
      console.error('Error fetching relations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/relations/fixed-relations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRelations();
        resetForm();
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating relation:', error);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/relations/fixed-relations/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRelations();
        setEditingId(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating relation:', error);
    }
  };

  const handleEdit = (relation: FixedRelation) => {
    setEditingId(relation.id!);
    setFormData(relation);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this relation?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/relations/fixed-relations/${id}/`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchRelations();
        }
      } catch (error) {
        console.error('Error deleting relation:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      relation_code: '',
      category: '',
      default_english: '',
      default_tamil: ''
    });
  };

  const categories = ['family', 'parent', 'child', 'spouse', 'sibling', 'other'];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fixed Relations</h2>
          <p className="text-gray-600 mt-1">Manage standard relation definitions</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          <Plus className="w-4 h-4" />
          Add Relation
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search relations by code or label..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              {editingId ? 'Edit Relation' : 'Create New Relation'}
            </h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation Code
              </label>
              <input
                type="text"
                name="relation_code"
                value={formData.relation_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., UNCLE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., family, parent, child"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Label
              </label>
              <input
                type="text"
                name="default_english"
                value={formData.default_english}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Uncle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamil Label
              </label>
              <input
                type="text"
                name="default_tamil"
                value={formData.default_tamil}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., மாமா"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Relations Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading relations...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relation Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  English Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamil Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRelations.map((relation) => (
                <tr key={relation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{relation.relation_code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded capitalize">
                      {relation.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{relation.default_english}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{relation.default_tamil}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(relation)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(relation.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && filteredRelations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No relations found
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedRelationsManager;