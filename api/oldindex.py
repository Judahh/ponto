from http.server import BaseHTTPRequestHandler
import json
# import register_fingerprint
from api.fingerprint import register_fingerprint
# import libs for query params

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Parse the query parameters
        received_url = self.path
        # Extract the username and url from the URL
        # Example: /?username=example&url=https://example.com
        query = received_url.split('?')[1] if '?' in received_url else ''
        params = dict(param.split('=') for param in query.split('&') if '=' in param)
        username = params.get('username')
        url = params.get('url')
        latitude = params.get('latitude')
        longitude = params.get('longitude')
        print(f"Received username: {username}")
        print(f"Received url: {url}")
        print(f"Received latitude: {latitude}")
        print(f"Received longitude: {longitude}")
        if username is None:
            self.send_response(200)
            self.send_header('Content-type','application/json')
            self.end_headers()
            # send response as json
            # service is working but username is not provided
            response = {
                "obs": "username is missing",
                "status": "running",
                "message": "service is running"
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        response = register_fingerprint(username=username, url=url, latitude=latitude, longitude=longitude)
        # if has no error in response
        if response.get('error') is None:
            self.send_response(200)
            self.send_header('Content-type','application/json')
            self.end_headers()
            # send response as json
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            # if has error in response
            self.send_response(500)
            self.send_header('Content-type','application/json')
            self.end_headers()
            # send response as json
            self.wfile.write(json.dumps(response).encode('utf-8'))
        return