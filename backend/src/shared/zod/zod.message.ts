import z from 'zod';

export function getEnumErr(
  item: readonly string[],
): Partial<z.core.$ZodIssueCustom> {
  return {
    message: `invalidEnum allow ${item.join(',')}`,
  };
}
