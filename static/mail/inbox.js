document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document
    .querySelector("#compose")
    .addEventListener("click", () => compose_email());

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  document.querySelector("#compose-form").addEventListener("submit", (e) => {
    e.preventDefault();
    recipients = document.querySelector("#compose-recipients");
    subject = document.querySelector("#compose-subject");
    body = document.querySelector("#compose-body");

    fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: body.value,
        }),
    })
    .then(response => response.json())
    .then((data) => {
        console.log(data.status);
        if (data.error) {
            alert(data.error);
            return true;
        }
        load_mailbox("sent");
    })
  });
}


function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  // document.querySelector("#compose-view").innerHTML = "";
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  if (mailbox == "show_mail") {
    show_mail();
    return;
  }

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((item) => {
        if (mailbox == "inbox") {
          if (item.read) 
            email_read = "read";
          else 
            email_read = "";
        } else 
          email_read = "";

        if (mailbox != "sent") {
          s_r = item.sender;
        } else {
          s_r = item.recipients;
        }

        let card_border = document.createElement("div");
        card_border.className = "card border-dark mb-3";

        let card_container = document.createElement("div");
        card_container.className = email_read;
        

        let card = document.createElement("div");
        card.className = "card";
        // card.id = email_read;
        
        let card_body = document.createElement("div");
        card_body.className = "card-body";
        card_body.id = "card_body";
        if (email_read === "read") {
          card_body.style.cssText = "background-color: grey;";
        } else {
          card_body.style.cssText = "";
        }
        
        let card_title = document.createElement("div");
        card_title.className = "card-title";
        card_title.innerHTML = 
        `
          <h5 style="display:inline-block;"> ${item.subject} </h5>
          <h6 style="display:inline-block;float:right;"> ${item.timestamp} </h5>
        `;
        

        let card_subtitle = document.createElement("h6");
        card_subtitle.className = "card-subtitle";
        card_subtitle.innerHTML = s_r;

        let card_text = document.createElement("p");
        card_text.className = "card-text";
        card_text.innerHTML = item.body.slice(0, 100);

        card_body.appendChild(card_title);
        card_body.appendChild(card_subtitle);
        card_body.appendChild(card_text);
        
        card.appendChild(card_body);

        card_container.appendChild(card);

        card_border.appendChild(card_container);

        document.querySelector("#emails-view").appendChild(card_border);
        card.addEventListener("click", () => {
          load_mail(item.id, mailbox);
        });
      });
    });
}

function load_mail(id, mailbox) {
  fetch(`/emails/${id}`)
  .then((response) => response.json())
  .then((email) => {
    // Print email
    // console.log(email);
    document.querySelector("#emails-view").innerHTML = "";
    let div = document.createElement("div");
    div.innerHTML = `<div style="white-space: pre-wrap;">
    Sender: ${email.sender}
    Recipients: ${email.recipients}
    Subject: ${email.subject}
    Time: ${email.timestamp}
    <br>${email.body}
    </div>`;
    document.querySelector("#emails-view").appendChild(div);
    if (mailbox == "sent") return;
    
    // Archive button
    let archive_button = document.createElement("button");

    if (email.archived) {
      archive_button.innerHTML = "Unarchive";
    }  
    else {
      archive_button.innerHTML = "Archive";
    } 
    
    archive_button.addEventListener("click", () => {
      archive(id, email.archived);
      if (archive_button.innerHTML == "Archive") 
        archive_button.innerHTML = "Unarchive";
      else 
        archive_button.innerHTML = "Archive";
    });
    
    document.querySelector("#emails-view").appendChild(archive_button);

    // Reply button
    let reply_button = document.createElement("button");
    reply_button.textContent = "Reply";
    reply_button.addEventListener("click", () => {
      reply(email.sender, email.subject, email.body, email.timestamp);
    });
    document.querySelector("#emails-view").appendChild(reply_button);
    read(id);
  });
}

function archive(id, state) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !state,
    }),
  });
}

function read(id) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

function reply(sender, subject, body, timestamp) {
  compose_email();
  if (!/^Re:/.test(subject)) {
    subject = `Re: ${subject}`;
  }
    
  document.querySelector("#compose-recipients").value = sender;
  document.querySelector("#compose-subject").value = subject;

  let email_body = `On ${timestamp}, ${sender} wrote:\n${body}\n`;

  document.querySelector("#compose-body").value = email_body;
}