const selectFilter = document.getElementById("filtering-items");

selectFilter.addEventListener("change", () => {
    const selectedValue = selectFilter.value;

    if (selectedValue === "nofilter") {
        // Display all items or remove filters
        document.querySelector(".games-section").style.display = "flex";
        document.querySelector(".services-section").style.display = "flex";
    } else if (selectedValue === "services") {
        // Only display services
        document.querySelector(".services-section").style.display = "flex";
        document.querySelector(".games-section").style.display = "none";
    } else if (selectedValue === "games") {
        // Only display games
        document.querySelector(".services-section").style.display = "none";
        document.querySelector(".games-section").style.display = "flex";
    }
});
