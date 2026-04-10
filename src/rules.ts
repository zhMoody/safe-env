export const isUrl = (v: string): boolean => {
  try {
    new URL(String(v));
    return true;
  } catch (e) {
    return false;
  }
};

export const isEmail = (v: string): boolean =>
  /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(String(v));

export const matchesRegex =
  (pattern: RegExp) =>
  (v: string): boolean =>
    pattern.test(String(v));


export const isIPv4 = (v: string): boolean =>
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(String(v));

export const isUUID = (v: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v));

export const isBase64 = (v: string): boolean =>
  /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(String(v));

export const isJSON = (v: string): boolean => {
  try {
    JSON.parse(String(v));
    return true;
  } catch {
    return false;
  }
};

export const isHexColor = (v: string): boolean =>
  /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(String(v));
  
export const isObjectId = (v: string): boolean =>
  /^[0-9a-fA-F]{24}$/.test(String(v));


export const trim = (v: string): string => String(v).trim();
export const toLowerCase = (v: string): string => String(v).toLowerCase();
export const toUpperCase = (v: string): string => String(v).toUpperCase();

export const toJSON = (v: string): any => {
  try {
    return JSON.parse(String(v));
  } catch {
    throw new Error("Invalid JSON string");
  }
};
