
    
    

    function move() {
       
        const targetPage = 'indexbg.html';


        const currentPage = window.location.pathname.split("/").pop();

     
        if (currentPage !== 'indexbg.html') {
            window.location.href = targetPage;
        } else {
            console.log("You're already on the index page or do not want to redirect here");
        }
    }

