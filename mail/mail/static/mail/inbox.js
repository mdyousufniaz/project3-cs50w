document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');

  
  document.querySelector('form').onsubmit = (event) => {
    event.preventDefault();
  
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify(
        ['recipients', 'subject', 'body'].reduce((obj, key) => {
          obj[key] = document.querySelector('#compose-' + key).value
          return obj;
        }, {})
      )
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    })
    .then(() => load_mailbox('sent'));
    
    
  };

  
});

async function compose_email(email_id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  //set value of the fields accroding to email_id
  const email_text ={
    recipients: '',
    subject: '',
    body: ''
  };
  console.log(email_id);

  if(email_id !== undefined){
    const response = await fetch(`emails/${email_id}`);
    const email = await response.json();

    email_text.recipients = email.sender;
    email_text.subject = (email.subject.startsWith('Re: '))? email.subject : `Re: ${email.subject}`;
    email_text.body = `On ${email.timestamp} ${email.sender} wrote:\n\t${email.body}\n`;
  }

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email_text.recipients;
  document.querySelector('#compose-subject').value = email_text.subject;
  document.querySelector('#compose-body').value = email_text.body;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // fetch emails from mailbox

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);
    if(emails.length > 0){
      emails.forEach(email => {
        console.log(email);
        
        const sender_tag = document.createElement('div');
        sender_tag.innerHTML = email['sender'];
        sender_tag.className = "px-1 font-weight-bold";
  
        const subject_tag = document.createElement('div');
        subject_tag.innerHTML = email['subject'];
        subject_tag.className = "px-1";
  
        const time_tag = document.createElement('div');
        time_tag.innerHTML = email['timestamp'];
        time_tag.className = "px-1 ml-auto";
  
        const email_div = document.createElement('div');
        email_div.className = "container-fluid d-flex border border-dark py-2 px-0 align-content-center";
        
        if(email.read){
          email_div.style.backgroundColor = 'gray';
          email_div.classList.add('text-white');
        }else{
          time_tag.classList.add('text-lmuted');
        }
  
        email_div.append(sender_tag, subject_tag, time_tag);
        email_div.addEventListener('click', () => email_view(email.id, mailbox));
  
  
        console.log(email_div);
        document.querySelector('#emails-view').appendChild(email_div);
  
      });
    }else{
      const default_view = document.createElement('div');
      default_view.className = "text-center text-muted border";
      default_view.innerHTML = `No Emails in <i>${mailbox}</i>.`;
      document.querySelector('#emails-view').appendChild(default_view);
    }
    

    // ... do something else with emails ...
  });
}

function email_view(email_id, mailbox){

  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      document.querySelector('#email-view').innerHTML = `
      <div class=""><b>From:</b> ${email.sender}</div>
      <div class=""><b>To:</b> ${email.recipients[0]}</div>
      <div class=""><b>Subject:</b> ${email.subject}</div>
      <div class=""><b>Timestamp:</b> <span>{% localtime on %}${email.timestamp}{% endlocaltime %}</span></div>
      
      `;

      if(mailbox !== 'sent'){

        const reply_btn = document.createElement('button');
        reply_btn.innerHTML = 'Reply';
        reply_btn.className = "btn btn-sm btn-outline-primary mx-1";
        reply_btn.addEventListener('click', () => {
          console.log('Reply button was clicked');
          compose_email(email.id);
        });

        document.querySelector('#email-view').appendChild(reply_btn);

        const arc_btn = document.createElement('button');
        arc_btn.className = "btn btn-sm btn-outline-primary mx-1";
        arc_btn.innerHTML = (mailbox === 'inbox')? 'Archive' : 'Unacrchive';
        arc_btn.onclick = () => {
          console.log('hello', mailbox === 'inbox');
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: mailbox === 'inbox'
            })
          })
          .then(() => {
            load_mailbox('inbox');
          });
        }

        document.querySelector('#email-view').appendChild(arc_btn);
      }

      const body_div = document.createElement('div');
      body_div.innerHTML = `<hr><div>${email.body}</div>`;

      document.querySelector('#email-view').appendChild(body_div);

      console.log(document.querySelector('#email-view').innerHTML);

      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        });
      }

      // ... do something else with email ...
  });
}