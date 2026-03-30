const welcomeImage = document.querySelector(".welcome-image");

if (welcomeImage) {
  const showImage = () => {
    welcomeImage.classList.add("is-visible");
  };

  if (welcomeImage.complete) {
    showImage();
  } else {
    welcomeImage.addEventListener("load", showImage, { once: true });
  }
}
