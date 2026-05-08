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
    fullName: "Adebayo Oluwaseun David",
    matricNumber: "PHY/2023/001",
    college: "College of Physical Sciences",
    department: "Department of Physics",
    whatsappNumber: "+234 801 234 5678",
    role: "Project Manager & Course Rep",
    roleDescription: "Coordinates meetings, ensures deadlines are met, and compiles the final report."
  },
  {
    fullName: "Okafor Chiamaka Grace",
    matricNumber: "PHY/2023/002",
    college: "College of Physical Sciences",
    department: "Department of Physics",
    whatsappNumber: "+234 802 345 6789",
    role: "Lead Physicist",
    roleDescription: "Responsible for ensuring the mathematical formulas (Faraday's Law, Energy Density) are correctly applied."
  },
  {
    fullName: "Eze Daniel Chukwudi",
    matricNumber: "PHY/2023/003",
    college: "College of Physical Sciences",
    department: "Department of Physics",
    whatsappNumber: "+234 803 456 7890",
    role: "Field Researcher",
    roleDescription: "Gathers real-world data (photos of local transformers, checking generator specs, interviewing local solar installers)."
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
  {
    fullName: "Ogunleye Joshua Olumide",
    matricNumber: "PHY/2023/005",
    college: "College of Physical Sciences",
    department: "Department of Physics",
    whatsappNumber: "+234 805 678 9012",
    role: "Q&A Specialist",
    roleDescription: "Prepares and leads the Question & Answer section, ensures all college members participate."
  },
  {
    fullName: "Nwachukwu Emmanuel Chinedu",
    matricNumber: "PHY/2023/006",
    college: "College of Physical Sciences",
    department: "Department of Physics",
    whatsappNumber: "+234 806 789 0123",
    role: "Research & Documentation Lead",
    roleDescription: "Compiles research findings, manages documentation, and supports presentation materials."
  }
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