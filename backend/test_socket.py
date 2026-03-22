import socketio
import time

sio = socketio.Client()

@sio.on('order:status_update')
def on_status_update(data):
    print(f"Received status update: {data}")

def test_socket():
    try:
        sio.connect('http://localhost:5000')
        print(f"Connected with SID: {sio.sid}")
        
        # Test joining room
        sio.emit('customer:join', {'orderId': 'test_order_123'})
        print("Emitted customer:join for test_order_123")
        
        # Wait a bit
        time.sleep(2)
        sio.disconnect()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_socket()
