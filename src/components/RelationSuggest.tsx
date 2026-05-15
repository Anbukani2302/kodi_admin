// components/RelationSuggest.tsx
import React, { useState, useEffect } from "react";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";

interface Suggestion {
  id: number;
  relation_code: string;
  suggested_label: string;
  language: string;
  lifestyle?: string;
  familyname8?: string;
  family?: string;
  suggested_by: string;
  suggested_by_mobile: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  votes: {
    upvotes: number;
    downvotes: number;
  };
}

const RelationSuggest: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    let filtered = suggestions;

    if (searchTerm) {
      filtered = filtered.filter(
        (suggestion) =>
          suggestion.relation_code
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          suggestion.suggested_label
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          suggestion.suggested_by
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (suggestion) => suggestion.status === filterStatus
      );
    }

    setFilteredSuggestions(filtered);
  }, [searchTerm, filterStatus, suggestions]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/relation-suggestions/`
      );
      const data = await response.json();
      setSuggestions(data);
      setFilteredSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (
    suggestionId: number,
    voteType: "upvote" | "downvote"
  ) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/relation-suggestions/${suggestionId}/vote/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vote_type: voteType }),
        }
      );

      if (response.ok) {
        fetchSuggestions();
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleApprove = async (suggestionId: number) => {
    if (window.confirm("Are you sure you want to approve this suggestion?")) {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/relation-suggestions/${suggestionId}/approve/`,
          {
            method: "POST",
          }
        );

        if (response.ok) {
          fetchSuggestions();
        }
      } catch (error) {
        console.error("Error approving suggestion:", error);
      }
    }
  };

  const handleReject = async (suggestionId: number) => {
    if (window.confirm("Are you sure you want to reject this suggestion?")) {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/relation-suggestions/${suggestionId}/reject/`,
          {
            method: "POST",
          }
        );

        if (response.ok) {
          fetchSuggestions();
        }
      } catch (error) {
        console.error("Error rejecting suggestion:", error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; icon: React.ReactNode }
    > = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>,
      },
      approved: {
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Relation Suggestions
          </h2>
          <p className="text-gray-600 mt-1">
            Review and approve relation label suggestions from users
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {suggestions.filter((s) => s.status === "pending").length} pending
          suggestions
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suggestions by code, label, or user..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading suggestions...</p>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No suggestions found
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left Side - Suggestion Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {suggestion.relation_code}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="font-medium text-gray-900">
                        {suggestion.suggested_label}
                      </span>
                    </div>
                    {getStatusBadge(suggestion.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Language:</span>
                      <span className="ml-2 font-medium">
                        {suggestion.language === "ta" ? "தமிழ்" : "English"}
                      </span>
                    </div>
                    {suggestion.lifestyle && (
                      <div>
                        <span className="text-gray-500">lifestyle:</span>
                        <span className="ml-2 font-medium capitalize">
                          {suggestion.lifestyle}
                        </span>
                      </div>
                    )}
                    {suggestion.familyname8 && (
                      <div>
                        <span className="text-gray-500">familyname8:</span>
                        <span className="ml-2 font-medium capitalize">
                          {suggestion.familyname8}
                        </span>
                      </div>
                    )}
                    {suggestion.family && (
                      <div>
                        <span className="text-gray-500">Family:</span>
                        <span className="ml-2 font-medium capitalize">
                          {suggestion.family}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <UserPlus className="w-4 h-4 mr-1" />
                    Suggested by {suggestion.suggested_by} (
                    {suggestion.suggested_by_mobile})
                    <span className="mx-2">•</span>
                    {new Date(suggestion.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Right Side - Actions */}
                <div className="flex flex-col items-end gap-3">
                  {/* Voting Stats */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium">
                        {suggestion.votes.upvotes}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="font-medium">
                        {suggestion.votes.downvotes}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {suggestion.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleVote(suggestion.id, "upvote")}
                          className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                          title="Upvote"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Upvote
                        </button>
                        <button
                          onClick={() => handleVote(suggestion.id, "downvote")}
                          className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                          title="Downvote"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Downvote
                        </button>
                      </>
                    )}

                    {suggestion.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(suggestion.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(suggestion.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RelationSuggest;
