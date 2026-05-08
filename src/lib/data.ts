// src/lib/data.ts
export interface Student {
  fullName: string;
  matricNumber: string;
  college: string;
  department: string;
  whatsappNumber: string;
  role: string;
  roleDescription: string;
}

export const students: Student[] = [
  {
    fullName: "OKORAFOR CHUKWUEMEKA APIA",
    matricNumber: "MOUAU/PHY/25/128699",
    college: "College of Physical Sciences",
    department: "Department of Physics",
    whatsappNumber: "+234 902 149 1241",
    role: "Project Manager & Course Rep",
    roleDescription: "Coordinates meetings, ensures deadlines are met, and compiles the final report."
  },
  {
    fullName: "DIVINE JOSEPH CHIBUIKEM",
    matricNumber: "MOUAU/CMP/25/130962",
    college: "College of Physical Sciences",
    department: "Department of Computer Science",
    whatsappNumber: "+234 704 693 1442",
    role: "Project Manager & Course Rep",
    roleDescription: "Gathers real-world data (photos of local transformers, checking generator specs, interviewing local solar installers)."
  },
  {
    fullName: "EGWUONWU CHIBUZOR ONYEUKWU",
    matricNumber: "MOUAU/CMP/25/130441",
    college: "College of Physical Sciences",
    department: "Department of Computer Science",
    whatsappNumber: "+234 814 521 6303",
    role: "Field Researcher",
    roleDescription: "Responsible for ensuring the mathematical formulas (Faraday's Law, Energy Density) are correctly applied."
  },
   {
    fullName: "OGWO GODSPOWER CHINAZA",
    matricNumber: "MOUAU/PHY/25/128468",
    college: "College of Physical Sciences",
    department: "Department of Physics",
    whatsappNumber: "+234 804 567 8901",
    role: "Technical Writer & Presenter",
    roleDescription: "Drafts final explanations, ensures physics is explained simply and clearly, leads class presentation."
  },
  
];

// Helper function to get formatted WhatsApp links
export function getWhatsAppLink(phoneNumber: string): string {
  // Remove any spaces, +, or special characters
  const cleanNumber = phoneNumber.replace(/[\s\+]/g, '');
  return `https://wa.me/${cleanNumber}`;
}

// Get students by role category
export function getStudentsByRole(role: string): Student[] {
  return students.filter(student => student.role === role);
}

// Get all unique roles
export const uniqueRoles = [...new Set(students.map(s => s.role))];