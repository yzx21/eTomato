var tabs = document.querySelectorAll(".tabs_wrap ul li");
var active = document.querySelectorAll(".active");
var calm = document.querySelectorAll(".calm");
var all = document.querySelectorAll(".item_wrap");
var sounds1 = new Audio("https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Factive.mp3?alt=media&token=f0b203f4-f034-4bae-a4db-fd7d7d05e87d");
var sounds2 = new Audio("https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fcalm.mp3?alt=media&token=508f5661-9340-4a0f-9d9a-4f0b75760650");


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