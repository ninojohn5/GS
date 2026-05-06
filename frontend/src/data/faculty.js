export const FACULTY_BY_COLLEGE = {
  "College of Computer Studies": [
    { id: "cs-001", name: "Dr. Maria Santos",     position: "Professor",           expertise: "Artificial Intelligence & Machine Learning" },
    { id: "cs-002", name: "Prof. John Cruz",       position: "Associate Professor", expertise: "Software Engineering" },
    { id: "cs-003", name: "Dr. Ana Reyes",         position: "Professor",           expertise: "Data Science & Analytics" },
    { id: "cs-004", name: "Dr. Ramon Villanueva",  position: "Assistant Professor", expertise: "Cybersecurity & Networks" },
    { id: "cs-005", name: "Prof. Claire Lim",      position: "Associate Professor", expertise: "Human-Computer Interaction" },
  ],
  "College of Agriculture": [
    { id: "ag-001", name: "Dr. Emily Rodriguez",   position: "Professor",           expertise: "Sustainable Agriculture" },
    { id: "ag-002", name: "Prof. Carlos Mendoza",  position: "Associate Professor", expertise: "Soil Science & Agronomy" },
    { id: "ag-003", name: "Dr. Linda Garcia",      position: "Professor",           expertise: "Plant Pathology" },
    { id: "ag-004", name: "Dr. Felix Bautista",    position: "Assistant Professor", expertise: "Agricultural Economics" },
    { id: "ag-005", name: "Prof. Rosa Castillo",   position: "Associate Professor", expertise: "Animal Science" },
  ],
  "College of Engineering": [
    { id: "en-001", name: "Dr. James Anderson",    position: "Professor",           expertise: "Civil & Structural Engineering" },
    { id: "en-002", name: "Prof. Lisa Martinez",   position: "Professor",           expertise: "Urban Planning & Infrastructure" },
    { id: "en-003", name: "Dr. Patrick Navarro",   position: "Associate Professor", expertise: "Electrical Engineering" },
    { id: "en-004", name: "Dr. Helen Torres",      position: "Assistant Professor", expertise: "Mechanical Engineering" },
    { id: "en-005", name: "Prof. Gilbert Ramos",   position: "Associate Professor", expertise: "Environmental Engineering" },
  ],
  "College of Sciences": [
    { id: "sc-001", name: "Dr. Karen Smith",       position: "Professor",           expertise: "Quantum Physics & Computing" },
    { id: "sc-002", name: "Prof. David Wilson",    position: "Professor",           expertise: "Marine Biology" },
    { id: "sc-003", name: "Dr. Patricia Brown",    position: "Associate Professor", expertise: "Environmental Science" },
    { id: "sc-004", name: "Dr. Michael Chen",      position: "Professor",           expertise: "Biochemistry & Molecular Biology" },
    { id: "sc-005", name: "Prof. Sarah Lee",       position: "Assistant Professor", expertise: "Applied Mathematics" },
  ],
  "College of Education": [
    { id: "ed-001", name: "Dr. Robert Williams",   position: "Professor",           expertise: "Educational Technology" },
    { id: "ed-002", name: "Prof. Angela Flores",   position: "Associate Professor", expertise: "Curriculum & Instruction" },
    { id: "ed-003", name: "Dr. Jose Dela Cruz",    position: "Assistant Professor", expertise: "Educational Research" },
    { id: "ed-004", name: "Prof. Maricel Ocampo",  position: "Associate Professor", expertise: "Special Education" },
  ],
  "College of Forestry": [
    { id: "fo-001", name: "Dr. Richard Taylor",    position: "Professor",           expertise: "Forest Ecology & Conservation" },
    { id: "fo-002", name: "Prof. Nena Domingo",    position: "Associate Professor", expertise: "Agroforestry" },
    { id: "fo-003", name: "Dr. Arnold Pascual",    position: "Assistant Professor", expertise: "Wildlife Management" },
  ],
  "College of Veterinary Medicine": [
    { id: "vm-001", name: "Dr. Cynthia Aquino",    position: "Professor",           expertise: "Veterinary Pathology" },
    { id: "vm-002", name: "Prof. Eduardo Reyes",   position: "Associate Professor", expertise: "Animal Nutrition" },
    { id: "vm-003", name: "Dr. Florita Jimenez",   position: "Assistant Professor", expertise: "Veterinary Public Health" },
  ],
};

// Default auto-assigned evaluators (pool to pick from)
export const DEFAULT_EVALUATORS = [
  { id: "cs-003", name: "Dr. Ana Reyes",       position: "Professor",           college: "College of Computer Studies",  expertise: "Data Science & Analytics" },
  { id: "sc-003", name: "Dr. Patricia Brown",  position: "Associate Professor", college: "College of Sciences",          expertise: "Environmental Science" },
];