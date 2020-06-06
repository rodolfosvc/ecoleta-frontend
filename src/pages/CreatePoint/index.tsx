import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import './styles.css';
import logo from '../../assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';
import axios from 'axios';

interface Item{
    id: number,
    title: string,
    image_url: string
}

interface IBGEUFResponse{
    sigla: string
}

interface IBGECityResponse{
    nome: string
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const [selectedUF, setselectedUF] = useState('0');
    const [selectedCity, setselectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
            setSelectedPosition([latitude, longitude]);
        });
    }, []);

    useEffect(() => {
        api.get('items')
            .then((response) => {
                setItems(response.data)
            })
    }, []);

    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then((response) => {
                const ibgeUfs = response.data.map(element => element.sigla);
                setUfs(ibgeUfs);
            });
    }, []);

    useEffect(() => {
        if(selectedUF !== '0'){
            axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`)
            .then((response) => {
                const ibgeCities = response.data.map(city => city.nome);
                setCities(ibgeCities);
            });
        }
    }, [selectedUF]);

    function handleSelectUF(e: ChangeEvent<HTMLSelectElement>){
        setselectedUF(e.target.value);
    }

    function handleSelectCity(e: ChangeEvent<HTMLSelectElement>){
        setselectedCity(e.target.value);
    }

    function handleMapClick(e: LeafletMouseEvent){
        setSelectedPosition([e.latlng.lat, e.latlng.lng]);
    }

    function handleInputChange(e: ChangeEvent<HTMLInputElement>){
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        })
    }

    function handleSelectItem(itemId: number){
        const alreadySelected = selectedItems.findIndex(item => item === itemId);
        let newSelectedItems = [];
        if(alreadySelected >= 0){
            newSelectedItems = selectedItems.filter(item => item !== itemId);
        }else{
            newSelectedItems = [...selectedItems, itemId]
        }
        setSelectedItems(newSelectedItems);
    }

    async function handleSubmit(e: FormEvent){
        e.preventDefault();

        const [latitude, longitude] = selectedPosition;
        const data = {
            ...formData,
            uf: selectedUF,
            city: selectedCity,
            latitude,
            longitude,
            items: selectedItems
        };

        await api.post('points', data);
        alert('Ponto de coleta criado!');
        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft/>
                    Voltar para Home 
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="email">E-mail</label>
                                <input 
                                    type="email"
                                    name="email"
                                    id="email"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="whatsapp">Whatsapp</label>
                                <input 
                                    type="text"
                                    name="whatsapp"
                                    id="whatsapp"
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}/>
                    </Map>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf" 
                                id="uf" 
                                value={selectedUF} 
                                onChange={handleSelectUF}
                            >
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div> 
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                value={selectedCity} 
                                id="city" 
                                onChange={handleSelectCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>        
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : '' }
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                        
                    </ul>
                </fieldset>
                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint;