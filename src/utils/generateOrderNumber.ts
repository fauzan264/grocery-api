import { v4 as uuidv4 } from "uuid";

export const generateCode = (prefix= '') => {
  return `${prefix}${uuidv4().split('-')[0].toUpperCase()}`
}