type StringWithNum = `${string}#${string}`;

export type PluralizeMessages = Partial<{
  [rule in Exclude<Intl.LDMLPluralRule, "other">]: StringWithNum;
}> & {
  other: string;
};

export const pluralize = (messages: PluralizeMessages, count: number) => {
  const pluralRules = new Intl.PluralRules("en-US", { type: "cardinal" });
  const rule = pluralRules.select(count);
  const message = messages[rule] ?? messages.other;
  return message.replace("#", count.toString());
};
