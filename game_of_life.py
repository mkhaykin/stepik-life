import random
from threading import Lock


class SingletonMeta(type):
    _instances = {}
    _lock: Lock = Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances or args or kwargs:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]


class GameOfLife(metaclass=SingletonMeta):
    def __init__(self, width=25, height=25):
        self.__width = width
        self.__height = height

        # current step
        self._counter = 0

        # current world
        self._world = []

        # self._world_change - last change in world:
        # -1    dead
        # 0     no change cell
        # +1    new
        self._world_change = []

        # TODO: search cycle in generation
        # self._world_history - last 10 world`s generate:
        # need for search cycle
        self._world_history = [10]

        # previous world
        self._world_prev = []

        self.generate_universe(width=width, height=height)

    @property
    def counter(self):
        return self._counter

    @property
    def world(self):
        return self._world

    @property
    def world_change(self):
        return self._world_change

    @property
    def world_prev(self):
        return self._world_prev

    @property
    def width(self):
        return self.__width

    @property
    def height(self):
        return self.__height

    def new_generation(self):
        self._world_prev = self._world
        self._counter += 1

        new_world = [[0 for _ in range(self.__width)] for _ in range(self.__height)]
        universe = self._world

        # not my code. check.
        for i in range(len(universe)):
            for j in range(len(universe[0])):
                if universe[i][j]:
                    if self.__get_near(universe, [i, j]) not in (2, 3):
                        new_world[i][j] = 0
                        continue
                    new_world[i][j] = 1
                    continue

                if self.__get_near(universe, [i, j]) == 3:
                    new_world[i][j] = 1
                    continue
                new_world[i][j] = 0

        # build world change
        # TODO: bad code. only test.
        self._world_change = [[new_world[i][j] - self._world[i][j]
                               for j in range(self.__width)]
                              for i in range(self.__height)]

        self._world = new_world


    # def resize(self, width=20, height=20):
    #     self.__width = width
    #     self.__height = height
    #     self._counter = 0
    #     # ?????????????????? ???????????? ????????????/?????????????? ???????????????????????????? ???????????? ?? ?????????????? ???????????? ????????????
    #     self.generate_universe(width=width, height=height)

    def generate_universe(self,  width=20, height=20):
        self.__width = width
        self.__height = height
        self._counter = 0
        self._world = [[random.randint(0, 1) for _ in range(self.__width)] for _ in range(self.__height)]
        self._world_change = [[0 for _ in range(self.__width)] for _ in range(self.__height)]
        self._world_prev = [[0 for _ in range(self.__width)] for _ in range(self.__height)]

    @staticmethod
    def __get_near(universe, pos, system=None):
        if system is None:
            system = ((-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1))

        count = 0
        for i in system:
            if universe[(pos[0] + i[0]) % len(universe)][(pos[1] + i[1]) % len(universe[0])]:
                count += 1
        return count
