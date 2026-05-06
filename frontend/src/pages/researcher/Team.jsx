import { useState, useEffect } from "react";
import { Plus, Mail, Trash2, Search } from "lucide-react";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import api from "../../utils/api";

const ROLE_STYLES = {
  Leader:      { bg: "#dcfce7", color: "#15803d" },
  "Co-Leader": { bg: "#dbeafe", color: "#1d4ed8" },
  Member:      { bg: "#f3f4f6", color: "#6b7280" },
};

export default function TeamManagement() {
  const [projects,        setProjects]        = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [members,         setMembers]         = useState([]);
  const [showModal,       setShowModal]       = useState(false);
  const [editingMember,   setEditingMember]   = useState(null);
  const [form,            setForm]            = useState({ personnel_id: "", role: "Member" });
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searching,      setSearching]      = useState(false);

  useEffect(() => {
    api.get("/projects").then((res) => {
      setProjects(res.data);
      if (res.data.length > 0) setSelectedProject(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    api.get(`/projects/${selectedProject}/team`).then((res) => setMembers(res.data));
  }, [selectedProject]);

  const openAdd = () => {
    setEditingMember(null);
    setForm({ personnel_id: "", role: "Member" });
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPerson(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setForm({ personnel_id: member.id, role: member.role });
    setError("");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this team member?")) return;
    try {
      await api.delete(`/projects/${selectedProject}/team/${id}`);
      setMembers((p) => p.filter((m) => m.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setSelectedPerson(null);
    try {
      const res = await api.get(`/personnel/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
      if (res.data.length === 0) setError("No personnel found. Make sure the person has a registered account.");
      else setError("");
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const selectPerson = (person) => {
    setSelectedPerson(person);
    setForm((f) => ({ ...f, personnel_id: person.id }));
    setSearchResults([]);
    setSearchQuery(person.name);
    setError("");
  };

  const handleSave = async () => {
    setError("");
    if (editingMember) {
      setLoading(true);
      try {
        const res = await api.put(`/projects/${selectedProject}/team/${editingMember.id}`, { role: form.role });
        setMembers((p) => p.map((m) => m.id === editingMember.id ? { ...m, role: res.data.role } : m));
        setShowModal(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update role.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.personnel_id) {
        setError("Please search and select a person first.");
        return;
      }
      setLoading(true);
      try {
        await api.post(`/projects/${selectedProject}/team`, {
          personnel_id: form.personnel_id,
          role: form.role,
        });
        const teamRes = await api.get(`/projects/${selectedProject}/team`);
        setMembers(teamRes.data);
        setShowModal(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to add team member.");
      } finally {
        setLoading(false);
      }
    }
  };

  const totalMembers   = members.length;
  const projectLeaders = members.filter((m) => m.role === "Leader").length;
  const departments    = new Set(members.map((m) => m.department)).size;

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="main-content">
        <Topbar title="Team Management" />
        <div className="dashboard-content">

          <div className="page-header">
            <div>
              <h3 className="page-subtitle">Manage project team members and roles</h3>
            </div>
            <button className="create-btn" onClick={openAdd}>
              <Plus size={16} /> Add Team Member
            </button>
          </div>

          {projects.length > 0 && (
            <div className="cp-section" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                  Select Project:
                </label>
                <div className="cp-select-wrap" style={{ flex: 1 }}>
                  <select
                    className="cp-select"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.reference_no} — {p.title}</option>
                    ))}
                  </select>
                  <span className="cp-select-chevron">▾</span>
                </div>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <h4 className="table-title">Current Team Members</h4>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const rs = ROLE_STYLES[m.role] || ROLE_STYLES.Member;
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="name-cell">
                            <div className="tm-avatar">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f7a1f" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            </div>
                            {m.name}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#6b7280" }}>
                            <Mail size={14} />
                            <span style={{ fontSize: 13 }}>{m.email}</span>
                          </div>
                        </td>
                        <td>{m.department || "—"}</td>
                        <td>
                          <span className="badge" style={{ background: rs.bg, color: rs.color }}>
                            {m.role}
                          </span>
                        </td>
                        <td>
                          <div className="actions" style={{ justifyContent: "flex-end" }}>
                            <span className="edit" onClick={() => openEdit(m)}>Edit</span>
                            {m.role !== "Leader" && (
                              <Trash2 size={16} className="delete" onClick={() => handleDelete(m.id)} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>
                        No team members yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tm-stats">
            <div className="tm-stat-card">
              <p className="tm-stat-num">{totalMembers}</p>
              <p className="tm-stat-label">Total Members</p>
            </div>
            <div className="tm-stat-card">
              <p className="tm-stat-num">{projectLeaders}</p>
              <p className="tm-stat-label">Project Leaders</p>
            </div>
            <div className="tm-stat-card">
              <p className="tm-stat-num">{departments}</p>
              <p className="tm-stat-label">Departments</p>
            </div>
          </div>

        </div>
      </div>

      {showModal && (
        <div className="tm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-title">
              {editingMember ? "Edit Team Member" : "Add Team Member"}
            </h3>

            {!editingMember && (
              <>
                <div className="cp-field" style={{ marginBottom: 12 }}>
                  <label className="cp-label">Search by Name or Email *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="cp-input"
                      style={{ flex: 1 }}
                      type="text"
                      placeholder="e.g. Juan Dela Cruz or juan@csu.edu.ph"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedPerson(null);
                        setForm((f) => ({ ...f, personnel_id: "" }));
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <button
                      className="cp-btn primary"
                      style={{ background: "#1f7a1f", borderColor: "#1f7a1f", whiteSpace: "nowrap" }}
                      onClick={handleSearch}
                      disabled={searching}
                    >
                      {searching ? "..." : <><Search size={14} /> Search</>}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      marginTop: 4,
                      background: "#fff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      maxHeight: 180,
                      overflowY: "auto",
                    }}>
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => selectPerson(p)}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f3f4f6",
                            fontSize: 13,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                        >
                          <div style={{ fontWeight: 600, color: "#111827" }}>{p.name}</div>
                          <div style={{ color: "#6b7280", fontSize: 12 }}>{p.email} · {p.role}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPerson && (
                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 12,
                    fontSize: 13,
                  }}>
                    <div style={{ fontWeight: 600, color: "#15803d" }}>✓ Selected: {selectedPerson.name}</div>
                    <div style={{ color: "#6b7280" }}>{selectedPerson.email}</div>
                  </div>
                )}
              </>
            )}

            {editingMember && (
              <div style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 13,
              }}>
                <div style={{ fontWeight: 600, color: "#111827" }}>{editingMember.name}</div>
                <div style={{ color: "#6b7280" }}>{editingMember.email}</div>
              </div>
            )}

            <div className="cp-field" style={{ marginBottom: 16 }}>
              <label className="cp-label">Role *</label>
              <div className="cp-select-wrap">
                <select
                  className="cp-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="Leader">Leader</option>
                  <option value="Co-Leader">Co-Leader</option>
                  <option value="Member">Member</option>
                </select>
                <span className="cp-select-chevron">▾</span>
              </div>
            </div>

            {error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <div className="tm-modal-actions">
              <button className="cp-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="cp-btn primary"
                style={{ background: "#1f7a1f", borderColor: "#1f7a1f" }}
                onClick={handleSave}
                disabled={loading || (!editingMember && !form.personnel_id)}
              >
                {loading ? "Saving..." : editingMember ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}