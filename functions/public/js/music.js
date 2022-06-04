var tabs = document.querySelectorAll(".tabs_wrap ul li");
var active = document.querySelectorAll(".active");
var calm = document.querySelectorAll(".calm");
var all = document.querySelectorAll(".item_wrap");
var sounds1 = new Audio("./public/sounds/active.mp3");
var sounds2 = new Audio("./public/sounds/calm.mp3");

tabs.forEach((tab)=>{
  tab.addEventListener("click", ()=>{
    tabs.forEach((tab)=>{
      tab.classList.remove("active");
    })
    tab.classList.add("active");
    var tabval = tab.getAttribute("data-tabs");

    all.forEach((item)=>{
      item.style.display = "none";
    })

    if(tabval == "active"){
      sounds1.play();
      sounds2.pause();
      active.forEach((active)=>{
        active.style.display = "block";
      })
    }
    else if(tabval == "calm"){
      sounds1.pause();
      sounds2.play();
      calm.forEach((calm)=>{
        calm.style.display = "block";
      })
    }
    else{
      sounds1.pause();
      sounds2.pause();
      all.forEach((item)=>{
        item.style.display = "block";
      })
    }

  })
})