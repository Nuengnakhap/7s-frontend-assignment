import hard from "./hard.json";
import express from "express";
import axios from "axios";
import { User } from "./types";

function maxPath(data: Array<Array<number>>) {
  console.time("max_path");
  for (let row = data.length - 2; row >= 0; row--) {
    for (let col = 0; col <= row; col++) {
      data[row][col] += Math.max(data[row + 1][col], data[row + 1][col + 1]);
    }
  }
  console.timeEnd("max_path");
  return data[0][0];
}

function decodeString(str: string) {
  console.time("decode_string");
  let result = Array.from<number>({ length: str.length + 1 });
  let maxL = 0;
  let maxR = 0;

  for (let i = 0; i < str.length - 1; i++) {
    if (str[i] == "L") {
      maxL += 1;
    } else if (str[i] == "R") {
      maxR += 1;
    }
  }

  for (let i = 0; i < str.length; i++) {
    if (str[i] == "L") {
      if (result[i] == undefined) {
        result[i] = maxL;
        result[i + 1] = maxL - 1;
      } else {
        result[i + 1] = result[i] - 1;
      }
    } else if (str[i] == "R") {
      if (result[i] == undefined) {
        result[i] = maxR - 1;
        result[i + 1] = maxR;
      } else {
        result[i + 1] = result[i] + 1;
      }
    } else {
      if (result[i] == undefined) {
        result[i] = 0;
        result[i + 1] = 0;
      } else {
        result[i + 1] = result[i];
      }
    }
  }

  console.timeEnd("decode_string");

  return result.join("");
}

console.log(maxPath(hard));
console.log(decodeString("LLRR="));

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

app.get("/beef/summary", async (req, res) => {
  const { data } = await axios.get(
    "https://baconipsum.com/api/?type=meat-and-filler&paras=99&format=text"
  );

  const words = data.replace(/[[\n.,]/gm, "").split(" ");
  const wordCount: { [key: string]: number } = {};

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word) {
      if (wordCount[word]) {
        wordCount[word]++;
      } else {
        wordCount[word] = 1;
      }
    }
  }

  res.send({ beef: wordCount });
});

app.get("/department/summary", async (req, res) => {
  const { data } = await axios.get<{
    users: User[];
  }>("https://dummyjson.com/users");

  const { users } = data;
  const departments: {
    [key: string]: {
      male: number;
      female: number;
      ageRange: { min: number; max: number };
      hair: { [key: string]: number };
      addressUser: { [key: string]: string };
    };
  } = {};

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!departments[user.company.department]) {
      departments[user.company.department] = {
        male: user.gender == "male" ? 1 : 0,
        female: user.gender == "female" ? 1 : 0,
        ageRange: { min: user.age, max: user.age },
        hair: { [user.hair.color]: 1 },
        addressUser: {
          [`${user.firstName}${user.lastName}`]: user.address.postalCode,
        },
      };
    } else {
      const { hair, ageRange } = departments[user.company.department];
      const { min, max } = ageRange;

      departments[user.company.department][user.gender] += 1;
      if (user.age > max) {
        departments[user.company.department].ageRange.max = user.age;
      } else if (user.age < min) {
        departments[user.company.department].ageRange.min = user.age;
      }
      if (!hair[user.hair.color]) {
        departments[user.company.department].hair[user.hair.color] = 1;
      } else {
        departments[user.company.department].hair[user.hair.color] += 1;
      }
      departments[user.company.department].addressUser[
        `${user.firstName}${user.lastName}`
      ] = user.address.postalCode;
    }
  }

  const results: {
    [key: string]: {
      male: number;
      female: number;
      ageRange: string;
      hair: { [key: string]: number };
      addressUser: { [key: string]: string };
    };
  }[] = [];

  for (const key in departments) {
    const item = departments[key];
    results.push({
      [key]: { ...item, ageRange: `${item.ageRange.min}-${item.ageRange.max}` },
    });
  }

  res.send({ department: results });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
