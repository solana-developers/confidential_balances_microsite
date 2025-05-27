// TODO: get rid of this in favor of CSS ellipsis
export const ellipsify = (str: string = '', len: number = 4) => {
  if (str.length > 30) {
    return str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
  }
  return str
}
