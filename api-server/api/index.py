import sys
import os
from mangum import Mangum

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from main import app

handler = Mangum(app)