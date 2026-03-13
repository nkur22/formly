import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ── Auth tables ────────────────────────────────────────────────────────────────

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ── App tables ─────────────────────────────────────────────────────────────────

export const questionTypeEnum = pgEnum("question_type", [
  "short_text",
  "long_text",
  "multiple_choice",
  "yes_no",
  "rating",
  "likert",
  "email",
  "number",
  "date",
]);

export const forms = pgTable("form", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Untitled Form"),
  description: text("description"),
  coverImage: text("coverImage"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const questions = pgTable("question", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  formId: text("formId")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull().default("short_text"),
  title: text("title").notNull().default(""),
  description: text("description"),
  required: boolean("required").notNull().default(false),
  order: integer("order").notNull().default(0),
  // multiple_choice: { options: string[] }
  // rating: { max: number }
  settings: jsonb("settings").$type<Record<string, unknown>>(),
});

export const responses = pgTable("response", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  formId: text("formId")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  respondentId: text("respondentId"),
  submittedAt: timestamp("submittedAt", { mode: "date" }).notNull().defaultNow(),
  complete: boolean("complete").notNull().default(false),
});

export const answers = pgTable(
  "answer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    responseId: text("responseId")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    questionId: text("questionId")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    value: text("value"),
  },
  (t) => [uniqueIndex("answer_response_question_idx").on(t.responseId, t.questionId)]
);
