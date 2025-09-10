const ArrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;

  for (let i = 0; i < bytes.length; i += chunk) {
    const subArray = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, subArray);
  }

  return btoa(binary);
}

export default ArrayBufferToBase64