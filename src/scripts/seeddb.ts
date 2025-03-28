import { faker } from "@faker-js/faker";
import { green } from "colorette";

import { User } from "@/models/user";

import { connectMongoDB } from "@/datasources/mongodb";

const seedDatabase = async () => {
  await User.deleteMany({});

  const users = Array.from({ length: 47 }).map((_, index) => {
    const email = `user${index + 1}@gmail.com`;
    return {
      email,
      passwordHash: "$2b$10$dIwuRq1qeBrzq/OKHoT6i.jQGbBNljeFHGYX5tCStB6Nq.iZYXWhC",
      // role: faker.helpers.arrayElement(["admin", "user"]),
      role: "user",
      fullName: faker.person.fullName(),
      isActive: true,
      isVerified: true,
      bio: faker.lorem.sentence(),
      gender: faker.helpers.arrayElement(["male", "female"]),
      dateOfBirth: faker.date.birthdate(),
      phoneCountryCode: faker.phone
        .number({ style: "international" })
        .substring(0, 3),
      phoneNumber: faker.phone.number({ style: "international" }).substring(3),
      addressCountry: faker.location.country(),
      addressCity: faker.location.city(),
      addressArea: faker.location.street(),
      addressZip: faker.location.zipCode()
    };
  });

  await User.insertMany(users);
};

async function main() {
  await seedDatabase();
  console.log(`\n${green("Done!")}`);
}

connectMongoDB()
  .then(main)
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
