const uri = "mongodb+srv://admin:pass@word@cluster0.abcde.mongodb.net/test?authSource=admin";
const match = uri.match(/^mongodb(?:\+srv)?:\/\/([^:]+):(.+)@(.+)$/);
if (match) {
  const [full, user, pass, host] = match;
  const fixed = `${uri.split('://')[0]}://${encodeURIComponent(decodeURIComponent(user))}:${encodeURIComponent(decodeURIComponent(pass))}@${host}`;
  console.log("Original:", uri);
  console.log("Fixed:   ", fixed);
  if (fixed === "mongodb+srv://admin:pass%40word@cluster0.abcde.mongodb.net/test?authSource=admin") {
    console.log("✅ Success!");
  } else {
    console.log("❌ Failed!");
    process.exit(1);
  }
} else {
  console.log("❌ No match found!");
  process.exit(1);
}
