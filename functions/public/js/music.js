var tabs = document.querySelectorAll(".tabs_wrap ul li");
var active = document.querySelectorAll(".active");
var calm = document.querySelectorAll(".calm");
var all = document.querySelectorAll(".item_wrap");

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
      males.forEach((active)=>{
        male.style.display = "block";
      })
    }
    else if(tabval == "calm"){
      females.forEach((calm)=>{
        female.style.display = "block";
      })
    }
    else{
      all.forEach((item)=>{
        item.style.display = "block";
      })
    }

  })
})