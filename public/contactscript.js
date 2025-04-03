function sendEmail() {
    window.location.href = "mailto:SwiftLOR@gmail.com";
}


function contactPhone() {
    let choice = confirm("Do you want to call or message?");
    if (choice) {
        window.location.href = "tel:+913456795678"; 
    } else {
        window.location.href = "sms:+913456795678";
    }
}