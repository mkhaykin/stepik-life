from os import urandom, environ
from flask import Flask
from flask import render_template
from flask import request, jsonify
from game_of_life import GameOfLife

import json

app = Flask(__name__)
app.config['SECRET_KEY'] = urandom(32)
# heroku port
port = int(environ.get("PORT", 5000))

game = GameOfLife()


@app.route('/', methods=['GET', 'POST'])
@app.route('/index.html', methods=['GET', 'POST'])
def index():
    return render_template('index.html')


@app.route('/status', methods=['GET'])
def status():
    data = {
        'height': game.height,
        'width': game.width,
        'step': game.counter,
        'world': game.world,
        'world_change': game.world_change,
        'world_prev': game.world_prev
    }
    json_data = json.dumps(data)
    return jsonify(json_data), 200


@app.route('/nextstep', methods=['GET'])
def nextstep():
    game.new_generation()
    data = {
        'status': 'ok'
    }
    json_data = json.dumps(data)
    return jsonify(json_data), 200


@app.route('/new', methods=['GET', 'POST'])
def new():
    data = {
        'status': 'ok'
    }
    if request.method == 'POST':
        try:
            if 'height' not in request.json or 'width' not in request.json:
                return jsonify({'status': 'not found params to create world'}), 400
            content = request.get_json(silent=True)
            height = int(content['height'])
            width = int(content['width'])
        except:
            return jsonify({'status': 'error parsing json'}), 400
        else:
            # game.resize(width=content['height'], height=content['width'])
            game.generate_universe(width=width, height=height)
    else:
        game.generate_universe()

    json_data = json.dumps(data)
    return jsonify(json_data), 200


if __name__ == '__main__':
    # app.run(debug=True)
    app.run(host='0.0.0.0', port=port, debug=False)
