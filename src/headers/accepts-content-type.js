export const acceptsContentType = (acceptHeader, contentType) => {
  if (typeof acceptHeader !== "string") {
    return false
  }
  return acceptHeader.split(",").some((accepted) => accepted === contentType)
}
