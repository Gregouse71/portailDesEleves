from app import db
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import MetaData, create_engine, text

from config import Config

Base = automap_base()

engine = create_engine(Config.URI)
Base.prepare(engine, reflect=True)
metadata = MetaData()
metadata.reflect(engine)
db_session = Session(engine)