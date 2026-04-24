import streamlit as st

# Configuration de la page
st.set_page_config(page_title="VéloPro Angers", page_icon="🚲")

# 1. STYLE VISUEL (Ivoire et Terre d'ombre)
st.markdown("""
    <style>
    .card {
        background-color: #FFFFF0; /* Ivoire */
        border: 2px solid #735C44; /* Terre d'ombre */
        padding: 25px;
        border-radius: 15px;
        color: #735C44;
        font-family: sans-serif;
        margin-bottom: 20px;
    }
    .badge {
        background-color: #735C44;
        color: #FFFFF0;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: bold;
    }
    .button {
        display: inline-block;
        background-color: #735C44;
        color: #FFFFF0 !important;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 8px;
        margin-top: 15px;
        font-weight: bold;
    }
    </style>
    """, unsafe_allow_html=True)

# 2. CONTENU DE L'APPLICATION
st.title("🚲 VéloPro Angers")
st.write("La plateforme des artisans qui font battre le cœur d'Angers à vélo.")

# 3. AFFICHAGE D'UNE CARTE ARTISAN
st.markdown("""
    <div class="card">
        <span class="badge">PLOMBERIE ÉCOLO</span>
        <h2>Jean La Fuite</h2>
        <p>Spécialiste du dépannage urgent à Angers. 
        Intervention 100% décarbonée en vélo-cargo.</p>
        <hr style="border: 0.5px solid #735C44; opacity: 0.3;">
        <p><strong>Capacité :</strong> 150kg | <strong>Note :</strong> 4.9/5</p>
        <a href="tel:0241000000" class="button">Appeler l'artisan</a>
    </div>
    """, unsafe_allow_html=True)
