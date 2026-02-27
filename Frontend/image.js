export function previewImage(input, imgElement) {
  const file = input.files[0];
  if (file) {
    imgElement.src = URL.createObjectURL(file);
  }
}
