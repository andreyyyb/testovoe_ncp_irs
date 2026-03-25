export type EmploymentType = "Работающий" | "Самозанятый" | "Временная занятость" | "Безработный";
export type CitizenStatus = "Активен" | "Требует проверки" | "Новая анкета" | "Архив";

export interface FamilyMember {
  id: string;
  fullName: string;
  relation: string;
  birthDate: string;
  occupation: string;
}

export interface EducationRecord {
  id: string;
  institution: string;
  qualification: string;
  graduationYear: number;
}

export interface RequestRecord {
  id: string;
  category: string;
  priority: "Низкий" | "Средний" | "Высокий";
  status: "Открыт" | "В работе" | "Закрыт";
  createdAt: string;
}

export interface Citizen {
  id: string;
  fullName: string;
  gender: "М" | "Ж";
  birthDate: string;
  age: number;
  snils: string;
  passport: string;
  inn: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  registrationDate: string;
  status: CitizenStatus;
  employmentType: EmploymentType;
  department: string;
  riskScore: number;
  familyMembers: FamilyMember[];
  education: EducationRecord[];
  requests: RequestRecord[];
}
