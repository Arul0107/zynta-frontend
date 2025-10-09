// QuotationPage.jsx
import React, { useState, useEffect } from "react";
import { Drawer } from "antd";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import QuotationForm from "./QuotationForm";
import QuotationList from "./QuotationList";
import NotesDrawer from "./NotesDrawer";

const QuotationPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [notesDrawerVisible, setNotesDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Saving state for preventing duplicate submissions

  const fetchQuotations = async () => {
    setLoading(true);
    const toastId = toast.loading("Loading quotations...");
    try {
      const res = await axios.get("/api/quotations");
      setQuotations(res.data);
      setFiltered(res.data);
      toast.success("Quotations loaded successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to load quotations", { id: toastId });
      console.error("Error fetching quotations:", err); // Log error for debugging
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleSave = async (data) => {
    if (isSaving) {
      // Prevent duplicate saves if already in progress
      toast("Quotation save in progress. Please wait...", { icon: "⏳" });
      return;
    }
    setIsSaving(true); // Set saving state to true

    const toastId = toast.loading("Saving quotation...");
    try {
      if (currentQuotation) {
        await axios.put(`/api/quotations/${currentQuotation._id}`, data);
      } else {
        await axios.post("/api/quotations", data);
      }
      toast.success("Quotation saved successfully!", { id: toastId });
      await fetchQuotations(); // Refresh list after saving
      setDrawerVisible(false); // Close the drawer
      setCurrentQuotation(null); // Reset current quotation
    } catch (err) {
      // Improved error message for the user, logging full error for developer
      console.error("Error saving quotation:", err.response?.data || err);
      toast.error(
        `Failed to save quotation: ${
          err.response?.data?.error || err.message || "Unknown error"
        }`,
        { id: toastId }
      );
    } finally {
      setIsSaving(false); // Reset saving state to false
    }
  };

  const handleDelete = async (id) => {
    const toastId = toast.loading("Deleting quotation...");
    try {
      await axios.delete(`/api/quotations/${id}`);
      toast.success("Quotation deleted successfully", { id: toastId });
      fetchQuotations(); // Refresh list after deletion
    } catch (err) {
      toast.error(`Failed to delete quotation: ${err.message}`, {
        id: toastId,
      });
      console.error("Error deleting quotation:", err); // Log error for debugging
    }
  };

  const handleSearch = (value) => {
    const val = value.toLowerCase();
    const result = quotations.filter(
      (q) =>
        q.businessName?.toLowerCase().includes(val) ||
        q.customerName?.toLowerCase().includes(val) ||
        q.quotationNumber?.toLowerCase().includes(val) ||
        q.notes?.some((note) => note.text?.toLowerCase().includes(val))
    );
    setFiltered(result);
  };

  return (
    <>
      <QuotationList
        quotations={
          filtered.length > 0 ||
          (filtered.length === 0 && quotations.length === 0 && !loading)
            ? filtered
            : quotations
        }
        onAddNew={() => {
          setCurrentQuotation(null);
          setDrawerVisible(true);
        }}
        onEdit={(quotation) => {
          setCurrentQuotation(quotation);
          setDrawerVisible(true);
        }}
        onDelete={handleDelete}
        onSearch={handleSearch}
        onViewNotes={(quotation) => {
          setCurrentQuotation(quotation);
          setNotesDrawerVisible(true);
        }}
        loading={loading}
      />

      <Drawer
        open={drawerVisible}
        title={currentQuotation ? "Edit Quotation" : "Create Quotation"}
        onClose={() => {
          setDrawerVisible(false);
          setCurrentQuotation(null);
        }}
        width={window.innerWidth > 768 ? "80vw" : "95vw"}
        destroyOnClose // Ensures form state is reset when drawer closes
      >
        <QuotationForm
          initialValues={currentQuotation}
          onSave={handleSave}
          onCancel={() => {
            setDrawerVisible(false);
            setCurrentQuotation(null);
          }}
          isSaving={isSaving} // Pass the isSaving state to disable form buttons
        />
      </Drawer>

      <NotesDrawer
        visible={notesDrawerVisible}
        onClose={() => {
          setNotesDrawerVisible(false);
          setCurrentQuotation(null);
        }}
        quotation={currentQuotation}
        refreshQuotations={fetchQuotations}
      />
    </>
  );
};

export default QuotationPage;