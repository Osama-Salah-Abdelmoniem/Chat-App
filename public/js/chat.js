const socket = io();

// elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $shareLocationButton = document.querySelector('#share-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector(
    '#location-message-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

// event listener for receiving a message
socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// event listener for receiving a location message
socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML = html;
});
// event listener for clients messages
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // disable the form
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        // enable the form
        $messageFormButton.removeAttribute('disabled');
        // resetting the value of the message input field
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }
    });
});

// event listener for sharing users location
$shareLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }
    $shareLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
        socket.emit('shareLocation', userLocation, () => {
            $shareLocationButton.removeAttribute('disabled');
        });
    });
});

// sending username and room to the server
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
