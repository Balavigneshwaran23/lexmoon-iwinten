document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            // Collect form data
            const formData = new FormData(contactForm);
            const data = {
                Name: formData.get('name'),
                Email: formData.get('email'),
                Message: formData.get('message')
            };

            // Send data to server
            fetch('/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.text())
            .then(result => {
                // Handle success response
                alert('Message sent successfully!');
                contactForm.reset();
            })
            .catch(error => {
                // Handle error response
                console.error('Error sending message:', error);
                alert('Error sending message. Please try again.');
            });
        });
    }
});
