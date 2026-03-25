import { Citizen, CitizenStatus, EmploymentType, RequestRecord } from "../types";

const firstNames = ["Алексей", "Ирина", "Никита", "Марина", "Евгений", "Татьяна", "Олег", "Ксения", "Павел", "Ольга"];
const lastNames = ["Иванов", "Петров", "Сидоров", "Козлов", "Попов", "Морозов", "Волков", "Смирнов", "Соколов", "Орлов"];
const patronymics = ["Александрович", "Игоревич", "Сергеевна", "Павлович", "Дмитриевна", "Николаевич"];
const cities = ["Москва", "Новосибирск", "Екатеринбург", "Казань", "Самара", "Краснодар"];
const districts = ["Центральный", "Северный", "Южный", "Западный", "Восточный"];
const departments = ["Соцподдержка", "Миграционный учет", "ЖКХ", "Help Desk", "МФЦ", "Пенсионный отдел"];
const requestCategories = ["Льготы", "Жалоба", "Справка", "Регистрация", "Техническая заявка", "Обращение"];

const statuses: CitizenStatus[] = ["Активен", "Требует проверки", "Новая анкета", "Архив"];
const employmentTypes: EmploymentType[] = ["Работающий", "Самозанятый", "Временная занятость", "Безработный"];

const pad = (n: number) => String(n).padStart(2, "0");

const randomItem = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (startYear: number, endYear: number) => {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
};

const countAge = (birthDate: string) => {
  const year = Number(birthDate.slice(0, 4));
  return new Date().getFullYear() - year;
};

const randomRequests = (): RequestRecord[] =>
  Array.from({ length: 2 + Math.floor(Math.random() * 4) }, (_, i) => ({
    id: `REQ-${Math.floor(Math.random() * 900000 + 100000)}`,
    category: randomItem(requestCategories),
    priority: randomItem(["Низкий", "Средний", "Высокий"] as const),
    status: randomItem(["Открыт", "В работе", "Закрыт"] as const),
    createdAt: randomDate(2023, 2026),
  }));

const generateCitizen = (index: number): Citizen => {
  const lastName = randomItem(lastNames);
  const firstName = randomItem(firstNames);
  const patronymic = randomItem(patronymics);
  const fullName = `${lastName} ${firstName} ${patronymic}`;
  const birthDate = randomDate(1965, 2005);
  const age = countAge(birthDate);

  return {
    id: `CIT-${String(index + 1).padStart(6, "0")}`,
    fullName,
    gender: Math.random() > 0.5 ? "М" : "Ж",
    birthDate,
    age,
    snils: `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 90 + 10)}`,
    passport: `${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900000 + 100000)}`,
    inn: String(Math.floor(Math.random() * 10 ** 12)).padStart(12, "0"),
    city: randomItem(cities),
    district: randomItem(districts),
    address: `ул. ${randomItem(["Ленина", "Пушкина", "Советская", "Лесная", "Школьная"])}, д. ${Math.floor(Math.random() * 180) + 1}`,
    phone: `+7 (9${Math.floor(Math.random() * 90 + 10)}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90 + 10)}`,
    email: `citizen${index + 1}@mail.ru`,
    registrationDate: randomDate(2019, 2026),
    status: randomItem(statuses),
    employmentType: randomItem(employmentTypes),
    department: randomItem(departments),
    riskScore: Math.floor(Math.random() * 100),
    familyMembers: [
      {
        id: `FAM-${index}-1`,
        fullName: `${randomItem(lastNames)} ${randomItem(firstNames)} ${randomItem(patronymics)}`,
        relation: randomItem(["Супруг(а)", "Ребенок", "Родитель"]),
        birthDate: randomDate(1970, 2018),
        occupation: randomItem(["Учится", "Работает", "Пенсионер", "Дошкольник"]),
      },
    ],
    education: [
      {
        id: `EDU-${index}-1`,
        institution: `${randomItem(["НГУ", "МГУ", "СПбГУ", "НГТУ", "КФУ"])} `,
        qualification: randomItem(["Бакалавр", "Специалист", "Магистр"]),
        graduationYear: Math.floor(Math.random() * 19) + 2005,
      },
    ],
    requests: randomRequests(),
  };
};

export const citizens: Citizen[] = Array.from({ length: 320 }, (_, i) => generateCitizen(i));
